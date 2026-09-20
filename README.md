# dcswitch

Painel web e simulação Wokwi para controlo de relés com ESP32 via MQTT.

## Painel web (React + TypeScript + Tailwind)

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # produção (pasta dist/, caminhos relativos: funciona em qualquer subpasta)
npm run typecheck && npm run lint
```

- **Interruptores personalizáveis**: toque em ✎ num cartão para alterar o **nome**, o **ícone** e a **cor** (paleta ou cor personalizada), com pré-visualização idêntica ao cartão real. As alterações ficam guardadas no browser (`localStorage`). Por omissão: 💡 verde, 🔌 azul, 🌀 âmbar, ❄️ ciano.
- **Cartões neon**: cada cartão acende com a sua cor quando está ligado; o estado (ligado/desligado) mostra-se com ponto e texto, e um pulsar indica que o comando está a ser aplicado.
- **Ligar todos / Desligar todos** e contador de interruptores ligados. O botão em destaque é o que faz sentido no momento; se já estiver tudo no estado pedido, aparece um aviso.
- **Estado da ligação claro**: servidor MQTT, dispositivo online/offline. Com o dispositivo ou o servidor offline os cartões ficam esbatidos (último estado conhecido) e clicar explica o motivo. Se um comando não obtiver resposta em 4 s, aparece um aviso.
- **Definições de ligação** (⚙): servidor MQTT (WebSocket) e prefixo do tópico, com validação. Os parâmetros `?mqtt=` e `?topic=` no endereço continuam a ter prioridade.
- **Interface tipo aplicação (PWA)**: responsiva (moldura de "aparelho" em ecrãs grandes), com ícone e `manifest.json` em `public/`, pode ser instalada no ecrã inicial do telemóvel. Tipo de letra incluído no build (sem CDN).
- Acessibilidade: cartões com `role="switch"`, diálogos com foco preso e Esc para fechar, foco visível e respeito por `prefers-reduced-motion`.

## Firmware (`dcswitch/sketch.ino`)

Além de `cmd` e `state`, o ESP32 publica agora o tópico `.../status` (`online`/`offline`, com Last Will), que o painel usa para mostrar se o dispositivo está ligado. O painel continua compatível com o firmware anterior.

Tópicos MQTT (prefixo `dcswitch/475688253278273537`):

| Tópico   | Direção        | Conteúdo                                     |
|----------|----------------|----------------------------------------------|
| `/cmd`   | painel → ESP32 | `{"action":"toggle","channel":0}`            |
| `/state` | ESP32 → painel | `{"states":[true,false,false,false]}`        |
| `/status`| ESP32 → painel | `online` / `offline`                         |
