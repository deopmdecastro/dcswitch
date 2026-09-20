# dcswitch

Painel web e simulação Wokwi para controlo de relés com ESP32 via MQTT.

## Painel web (`index.html`)

- **Interruptores personalizáveis**: toque em ✎ num cartão para alterar o **nome**, o **ícone** e a **cor** (paleta ou cor personalizada), com pré-visualização em tempo real. As alterações ficam guardadas no browser (`localStorage`).
- **Cada interruptor tem cor e nome distintos** por omissão, e o cartão acende com a cor escolhida quando está ligado.
- **Ligar todos / Desligar todos** e contador de interruptores ligados.
- **Estado da ligação claro**: servidor MQTT, dispositivo online/offline e feedback quando o dispositivo não responde.
- **Definições de ligação** (⚙): servidor MQTT (WebSocket) e prefixo do tópico, sem editar o código. Os parâmetros `?mqtt=` e `?topic=` no endereço continuam a ter prioridade.
- **Interface tipo aplicação (PWA)**: responsiva, com ícone e `manifest.json`, pode ser instalada no ecrã inicial do telemóvel. Sem dependência de Tailwind/CDN de estilos.
- Acessibilidade: `aria-pressed`, foco visível e respeito por `prefers-reduced-motion`.

## Firmware (`dcswitch/sketch.ino`)

Além de `cmd` e `state`, o ESP32 publica agora o tópico `.../status` (`online`/`offline`, com Last Will), que o painel usa para mostrar se o dispositivo está ligado. O painel continua compatível com o firmware anterior.

Tópicos MQTT (prefixo `dcswitch/475688253278273537`):

| Tópico   | Direção        | Conteúdo                                     |
|----------|----------------|----------------------------------------------|
| `/cmd`   | painel → ESP32 | `{"action":"toggle","channel":0}`            |
| `/state` | ESP32 → painel | `{"states":[true,false,false,false]}`        |
| `/status`| ESP32 → painel | `online` / `offline`                         |
