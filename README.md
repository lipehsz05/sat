# SAT TELECOM — App do Cliente

App React Native (Expo) para clientes da **SAT TELECOM** (Alagoa Nova-PB): faturas, boletos, notas fiscais e serviços rápidos.

## Estrutura

```
sat/
├── assets/                 # Logo, banners e ícones
├── packages/api-contract/  # Tipos e API mockada (TypeScript)
└── apps/mobile-expo/     # App React Native + Expo
```

## Credenciais de teste

| Campo | Valor |
|-------|-------|
| CPF | `529.982.247-25` |
| Senha | `123456` |

Primeiro acesso: use qualquer CPF/CNPJ válido não cadastrado; código de verificação mock: `1234`.

## Rodar o app

Você já deve estar na pasta do app (`apps/mobile-expo`). Se estiver na raiz do projeto:

```bash
cd apps/mobile-expo
npm install
npm start
```

Use o **Expo Go** no celular (mesma versão dos apps Cortaí — SDK 54). Escaneie o QR Code do terminal.

> **Não abra** `http://localhost:8081` no navegador. Se não conectar na Wi‑Fi, use `npm run start:tunnel`.

## Mídias

Substitua os arquivos em [`assets/logo/`](assets/logo/) e [`assets/banners/`](assets/banners/) pelos da sua marca. Veja [`assets/README.md`](assets/README.md).

## Segurança

- Sessão armazenada em `expo-secure-store`
- CPF/CNPJ mascarado na tela de ajustes
- Cliente HTTP preparado para API real (`apps/mobile-expo/api/client.ts`)
