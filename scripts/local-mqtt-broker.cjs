const net = require('node:net');
const mqttPacket = require('mqtt-packet');
const WebSocket = require('ws');

const TCP_PORT = Number(process.env.MQTT_TCP_PORT || 1883);
const WS_PORT = Number(process.env.MQTT_WS_PORT || 9001);

const clients = new Set();
const retained = new Map();

function topicMatches(filter, topic) {
  const filterParts = filter.split('/');
  const topicParts = topic.split('/');

  for (let i = 0; i < filterParts.length; i += 1) {
    const part = filterParts[i];
    if (part === '#') return i === filterParts.length - 1;
    if (part !== '+' && part !== topicParts[i]) return false;
  }

  return filterParts.length === topicParts.length;
}

function send(client, packet) {
  const data = mqttPacket.generate(packet);
  if (client.kind === 'ws') {
    if (client.socket.readyState === WebSocket.OPEN) client.socket.send(data);
    return;
  }
  if (!client.socket.destroyed) client.socket.write(data);
}

function matchingClients(topic) {
  return Array.from(clients).filter((client) =>
    client.subscriptions.some((filter) => topicMatches(filter, topic)),
  );
}

function publish(packet) {
  const payload = Buffer.isBuffer(packet.payload)
    ? packet.payload
    : Buffer.from(packet.payload ?? '');

  if (packet.retain) {
    if (payload.length === 0) retained.delete(packet.topic);
    else {
      retained.set(packet.topic, {
        cmd: 'publish',
        topic: packet.topic,
        payload,
        qos: 0,
        retain: true,
        dup: false,
      });
    }
  }

  for (const client of matchingClients(packet.topic)) {
    send(client, {
      cmd: 'publish',
      topic: packet.topic,
      payload,
      qos: 0,
      retain: Boolean(packet.retain),
      dup: false,
    });
  }
}

function closeClient(client, graceful = false) {
  if (!clients.delete(client)) return;
  if (!graceful && client.will) {
    publish({
      cmd: 'publish',
      topic: client.will.topic,
      payload: client.will.payload,
      retain: client.will.retain,
    });
  }
}

function createClient(socket, kind) {
  const client = {
    kind,
    socket,
    parser: mqttPacket.parser(),
    subscriptions: [],
    will: null,
  };

  client.parser.on('packet', (packet) => {
    switch (packet.cmd) {
      case 'connect':
        client.clientId = packet.clientId;
        client.will = packet.will ?? null;
        clients.add(client);
        send(client, { cmd: 'connack', returnCode: 0, sessionPresent: false });
        console.log(`[mqtt] connect ${client.clientId || '(sem clientId)'} via ${kind}`);
        break;

      case 'subscribe':
        client.subscriptions.push(...packet.subscriptions.map((sub) => sub.topic));
        send(client, {
          cmd: 'suback',
          messageId: packet.messageId,
          granted: packet.subscriptions.map(() => 0),
        });
        for (const sub of packet.subscriptions) {
          for (const retainedPacket of retained.values()) {
            if (topicMatches(sub.topic, retainedPacket.topic)) send(client, retainedPacket);
          }
        }
        break;

      case 'publish':
        publish(packet);
        if (packet.qos === 1) send(client, { cmd: 'puback', messageId: packet.messageId });
        break;

      case 'pingreq':
        send(client, { cmd: 'pingresp' });
        break;

      case 'disconnect':
        closeClient(client, true);
        socket.end?.();
        socket.close?.();
        break;

      default:
        break;
    }
  });

  client.parser.on('error', (error) => {
    console.error('[mqtt] parser error:', error.message);
    closeClient(client);
    socket.destroy?.();
    socket.close?.();
  });

  return client;
}

const tcpServer = net.createServer((socket) => {
  const client = createClient(socket, 'tcp');
  socket.on('data', (data) => client.parser.parse(data));
  socket.on('close', () => closeClient(client));
  socket.on('error', () => closeClient(client));
});

const wsServer = new WebSocket.Server({ port: WS_PORT, path: '/mqtt' });
wsServer.on('connection', (socket) => {
  const client = createClient(socket, 'ws');
  socket.on('message', (data) => client.parser.parse(Buffer.from(data)));
  socket.on('close', () => closeClient(client));
  socket.on('error', () => closeClient(client));
});

tcpServer.listen(TCP_PORT, '0.0.0.0', () => {
  console.log(`[mqtt] TCP em mqtt://0.0.0.0:${TCP_PORT}`);
});

wsServer.on('listening', () => {
  console.log(`[mqtt] WebSocket em ws://127.0.0.1:${WS_PORT}/mqtt`);
});
