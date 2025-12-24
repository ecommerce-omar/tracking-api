# 📦 Tracking API

API de rastreamento de pedidos com integração à API dos Correios, construída com Clean Architecture e TypeScript.

## 🏗️ Arquitetura

Este projeto segue os princípios da **Clean Architecture**, organizando o código em camadas bem definidas com separação clara de responsabilidades.

### Estrutura de Camadas

```
src/
├── domain/                 # Camada de Domínio (regras de negócio puras)
│   ├── entities/           # Entidades do negócio
│   ├── repositories/       # Interfaces de repositório (contratos)
│   ├── services/          # Interfaces de serviços de domínio
│   ├── value-objects/     # Objetos de valor (TrackingCode, CustomerCPF)
│   ├── events/            # Eventos de domínio
│   └── types/             # Tipos e enums do domínio
├── application/           # Camada de Aplicação (casos de uso)
│   ├── use-cases/         # Casos de uso do negócio
│   └── types/             # Tipos da aplicação
├── infrastructure/        # Camada de Infraestrutura (implementações)
│   ├── repositories/      # Implementações de repositório (Supabase)
│   ├── services/          # Serviços de infraestrutura (EmailEventPublisher)
│   ├── middlewares/       # Middlewares do Express
│   ├── container/         # Container de Injeção de Dependências
│   └── types/             # Tipos de infraestrutura
├── presentation/          # Camada de Apresentação (API REST)
│   ├── controllers/       # Controllers HTTP
│   └── types/             # Tipos de apresentação
├── routes/                # Definição de rotas Express
├── schemas/               # Schemas de validação (Zod)
├── config/                # Configurações (database, email, env)
├── jobs/                  # Jobs/Cron jobs (rastreamento automático)
├── services/              # Serviços auxiliares (Correios, templates)
├── middlewares/           # Middlewares compartilhados (emailSender)
└── shared/                # Código compartilhado
    ├── utils/             # Utilitários (Logger, eventComparator)
    └── types/             # Tipos compartilhados
```

### Componentes Principais

- **Container DI**: Gerenciamento de dependências com singleton pattern
- **Sistema de Rastreamento**: Job automatizado com consultas otimizadas
- **Sistema de Eventos**: Notificações por email via `EmailEventPublisher`
- **Validação de Ambiente**: Validação automática de variáveis obrigatórias no startup
- **Validação de Dados**: Schemas Zod para validação rigorosa de entrada

## 🚀 Tecnologias

- **Runtime**: Node.js 18+ com TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Email**: Nodemailer com Templates Dinâmicos
- **Template Engine**: Handlebars (condicionais, loops, variáveis)
- **Validação**: Zod (schemas com regex para tracking codes)
- **Testes**: Jest com cobertura completa
- **Cron Jobs**: node-cron (rastreamento automático)
- **API Externa**: API oficial dos Correios

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js >= 18
- pnpm (recomendado) ou npm
- Conta Supabase (gratuita ou paga)
- Credenciais da API dos Correios
- Configuração de email SMTP

### 1. Clone o repositório

```bash
git clone <repository-url>
cd tracking-api
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_supabase
DATABASE_URL=postgresql://user:pass@host:port/database

# Correios API Configuration
CORREIOS_USERNAME=seu_usuario_correios
CORREIOS_PASSWORD=sua_senha_correios
CORREIOS_CONTRACT=seu_contrato
CORREIOS_CARD=seu_cartao_postagem
CORREIOS_API_KEY=sua_api_key
CORREIOS_POSTAL_CARD=seu_cartao_postagem

# Email Configuration (Gmail SMTP exemplo)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=seu_email@gmail.com
MAIL_PASS=sua_senha_app
MAIL_SECURE=true

# Server
PORT=3000
NODE_ENV=development
```

> **⚠️ IMPORTANTE**: Todas as variáveis acima são **obrigatórias**. O sistema validará no startup e falhará se alguma estiver faltando.

### 4. Configure o banco de dados no Supabase

Execute o script SQL abaixo no **SQL Editor** do Supabase:

```sql
-- Tabela de rastreamentos
CREATE TABLE tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id INTEGER NOT NULL CHECK (order_id >= 100000 AND order_id <= 999999),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    contact NUMERIC,
    tracking_code VARCHAR(13) UNIQUE NOT NULL,
    current_status VARCHAR(100) NOT NULL DEFAULT 'pending',
    category VARCHAR(100) NOT NULL,
    delivery_channel TEXT NOT NULL CHECK (delivery_channel IN ('delivery', 'pickup-in-point')) DEFAULT 'delivery',
    products JSONB,
    quantity INTEGER NOT NULL DEFAULT 1,
    events JSONB DEFAULT '[]',
    dt_expected TIMESTAMPTZ,
    sender VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_tracking_tracking_code ON tracking(tracking_code);
CREATE INDEX idx_tracking_current_status ON tracking(current_status);
CREATE INDEX idx_tracking_category ON tracking(category);

-- Tabela de templates de email
CREATE TABLE email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para templates
CREATE INDEX idx_email_templates_name ON email_templates(name);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);
```

## 🎯 Comandos de Desenvolvimento

```bash
# Desenvolvimento com auto-reload
pnpm dev

# Build do projeto
pnpm build

# Executar em produção
pnpm start

# Executar testes
pnpm test

# Testes em modo watch
pnpm test:watch

# Coverage de testes
pnpm test:coverage
```

## 📡 API Endpoints

### 📍 Tracking

#### Rastrear pedido
```http
GET /tracking/:trackingCode
```

**Validação**: Código deve ter exatamente 13 caracteres alfanuméricos maiúsculos (ex: `AA123456789BR`)

**Resposta:**
```json
{
  "codigo": "AA123456789BR",
  "status": "Objeto entregue ao destinatário",
  "eventos": [
    {
      "data": "2024-01-15T14:30:00",
      "local": "São Paulo/SP",
      "status": "Objeto entregue ao destinatário",
      "description": "Objeto entregue ao destinatário"
    }
  ],
  "dtPrevista": "2024-01-15T23:59:59"
}
```

### ✉️ Templates de Email

#### Listar templates
```http
GET /templates
```

#### Buscar template por nome
```http
GET /templates/:name
```

#### Criar template
```http
POST /templates
```

**Body:**
```json
{
  "name": "Objeto entregue",
  "subject": "Seu pedido foi entregue!",
  "body_html": "<h1>Olá {{customer_name}}!</h1><p>Código: {{tracking_code}}</p>",
  "body_text": "Olá {{customer_name}}! Código: {{tracking_code}}",
  "variables": {
    "customer_name": "{{customer_name}}",
    "tracking_code": "{{tracking_code}}",
    "products": "{{products}}"
  },
  "category": "notificacao",
  "is_active": true
}
```

#### Atualizar template
```http
PUT /templates/:id
```

#### Deletar template
```http
DELETE /templates/:id
```

#### Enviar email de teste
```http
POST /templates/:name/test
Content-Type: application/json

{
  "email": "seu-email@example.com"
}
```

## 📦 Status de Rastreamento

O sistema mapeia **todos os 22 status** oficiais dos Correios:

### Status Iniciais
- `Etiqueta emitida` - Etiqueta gerada
- `Etiqueta cancelada pelo emissor` - Etiqueta cancelada
- `Objeto coletado` - Coletado pelos Correios
- `Objeto postado` - Postado na agência

### Status de Trânsito
- `Objeto em transferência - por favor aguarde` - Em trânsito
- `Objeto em correção de rota` - Correção de rota

### Status de Entrega
- `Objeto saiu para entrega ao destinatário` - Saiu para entrega
- `Objeto saiu para entrega ao remetente` - Retorno ao remetente
- `Objeto aguardando retirada no endereço indicado` - Aguardando retirada
- `Objeto encaminhado para retirada no endereço indicado` - Encaminhado para retirada
- `Direcionado para entrega em unidade dos Correios a pedido do cliente` - Na unidade

### Status de Não Entrega
- `Objeto não entregue` - Não entregue (genérico)
- `Objeto não entregue - endereço incorreto` - Endereço incorreto
- `Objeto não entregue - endereço insuficiente` - Endereço insuficiente
- `Objeto não entregue - carteiro não atendido` - Carteiro não atendido
- `Objeto não entregue - prazo de retirada encerrado` - Prazo encerrado

### Status de Cancelamento
- `Saída para entrega cancelada` - Entrega cancelada
- `Cancelado` - Pedido cancelado
- `Devolvido` - Devolvido ao remetente

### Status de Conclusão
- `Objeto entregue ao destinatário` - ✅ Entregue com sucesso
- `Objeto entregue ao remetente` - Devolvido e entregue ao remetente
- `Objeto entregue na Caixa de Correios Inteligente` - ✅ Entregue na Caixa Inteligente

> **📝 Nota**: Status em negrito são os únicos que **não enviam emails** automaticamente:
> - `Objeto saiu para entrega ao remetente`
> - `Objeto entregue ao remetente`
> - `Cancelado`
> - `Devolvido`
> - `Etiqueta cancelada pelo emissor`

## 🔄 Sistema de Rastreamento Automático

### Funcionamento do Job

O job automatizado executa:

- **Intervalo**: A cada 20 minutos (horário comercial)
- **Dias**: Segunda a sábado, das 5h às 22h
- **Otimização**: Consulta apenas pedidos não finalizados
- **Validação**: Processa apenas códigos válidos (13 caracteres alfanuméricos)

### Fluxo de Atualização

1. Busca rastreamentos com status != "Objeto entregue ao destinatário"
2. Consulta API dos Correios para cada código
3. Compara eventos por conteúdo (evita updates desnecessários)
4. Atualiza `current_status`, `events` e `dt_expected` se houver mudanças
5. Dispara email automático via `EmailEventPublisher` (se aplicável)

### Prevenção de Race Conditions

- **Token Service**: Mutex para evitar múltiplas chamadas simultâneas à API dos Correios
- **Promise Sharing**: Requisições simultâneas compartilham a mesma Promise de token

## 📧 Sistema de Notificações

### Regras de Envio

1. **Canal de Entrega**:
   - `delivery`: ✅ Recebe emails
   - `pickup-in-point`: ❌ Não recebe emails

2. **Status do Template**:
   - `is_active: true`: ✅ Envia email
   - `is_active: false`: ❌ Não envia email

### Mapeamento de Status para Templates

| Status dos Correios | Template |
|---------------------|----------|
| Objeto entregue ao destinatário | Objeto entregue |
| Objeto entregue na Caixa de Correios Inteligente | Objeto entregue |
| Objeto saiu para entrega ao destinatário | Saiu para entrega |
| Objeto aguardando retirada no endereço indicado | Aguardando retirada |
| Objeto não entregue (todos os tipos) | Não entregue |
| Saída para entrega cancelada | Saída cancelada |
| Objeto em transferência | Em transferência |
| Objeto postado | Postado |
| Objeto coletado | Coletado |
| Etiqueta emitida | Etiqueta emitida |

## 🎨 Templates Handlebars

O sistema utiliza **Handlebars** como engine de templates, suportando recursos avançados como condicionais, loops e helpers.

### ✨ Recursos Disponíveis

#### 1. Variáveis Simples
```handlebars
<p>Olá, <strong>{{customer_name}}</strong>!</p>
<p>Código de rastreio: {{tracking_code}}</p>
```

#### 2. Condicionais
```handlebars
{{#if detail}}
  <p><strong>Motivo:</strong> {{detail}}</p>
{{/if}}

{{#if unit_address}}
  <p>Endereço: {{unit_address}}</p>
  {{#if unit_cep}}
    <p>CEP: {{unit_cep}}</p>
  {{/if}}
{{/if}}
```

#### 3. Loops (Arrays)
```handlebars
<ul>
  {{#each products}}
    <li>{{this}}</li>
  {{/each}}
</ul>
```

### 📋 Variáveis Disponíveis

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `customer_name` | string | Nome do cliente |
| `email` | string | Email do destinatário |
| `tracking_code` | string | Código de rastreamento (13 caracteres) |
| `products` | string \| string[] | Lista de produtos (string ou array) |
| `status` | string | Status atual do rastreamento |
| `detail` | string? | Detalhes adicionais (opcional) |
| `origin_unit` | string? | Unidade de origem (opcional) |
| `destination_unit` | string? | Unidade de destino (opcional) |
| `unit_address` | string? | Endereço da unidade (opcional) |
| `unit_cep` | string? | CEP da unidade (opcional) |

### 📝 Exemplo Completo

```html
<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
  <h2 style="color: #E51036;">Entrega não realizada</h2>

  <p>Olá, <strong>{{customer_name}}</strong></p>

  <p>Infelizmente a entrega <strong>não foi concluída</strong>.</p>

  {{#if detail}}
    <p><strong>Motivo:</strong> {{detail}}</p>
  {{/if}}

  <p><strong>Código de rastreio:</strong> {{tracking_code}}</p>

  {{#if unit_address}}
  <p><strong>Local da tentativa de entrega:</strong><br>
    {{unit_address}}<br>
    {{#if unit_cep}}CEP: {{unit_cep}}{{/if}}
  </p>
  {{/if}}

  <p><strong>Produtos:</strong></p>
  <ul style="padding-left: 20px; margin: 8px 0 16px 0; list-style-type: disc;">
    {{#each products}}
      <li>{{this}}</li>
    {{/each}}
  </ul>

  <a href="https://rastreamento.correios.com.br/app/index.php?objetos={{tracking_code}}"
     style="background:#E51036;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:10px;">
     Acompanhar Pedido
  </a>
</div>
```

> 📚 **Mais exemplos**: Veja a pasta [`template-examples/`](./template-examples/) para templates completos e documentação detalhada do Handlebars.

## 🔒 Segurança e Validação

### Validações Implementadas

✅ **Variáveis de ambiente**: Validação no startup (fail-fast)
✅ **Tracking codes**: Regex `/^[A-Z0-9]+$/` + 13 caracteres
✅ **Order IDs**: 6 dígitos exatos (100000-999999)
✅ **Status**: Enum com 22 status oficiais dos Correios
✅ **Delivery channel**: Enum `["delivery", "pickup-in-point"]`
✅ **Data prevista**: ISO 8601 format
✅ **CPF**: Validação e sanitização
✅ **Email**: Validação de formato

### Correções de Bugs Recentes

🐛 **Corrigido**: Middleware de erro agora vem DEPOIS das rotas
🐛 **Corrigido**: Race condition no serviço de tokens
🐛 **Corrigido**: Ordem de verificação de status (específico → genérico)
🐛 **Corrigido**: Schemas sincronizados com enum TrackingStatus
🐛 **Corrigido**: Validação de regex nos tracking codes

## 🧪 Testes

### Cobertura

- ✅ Domain Layer (Entidades, Value Objects, Eventos)
- ✅ Application Layer (Use Cases)
- ✅ Infrastructure Layer (Repositories, Services)
- ✅ Shared Layer (Utilities)
- ✅ Middlewares (Email sender, Validators)

```bash
# Executar todos os testes
pnpm test

# Coverage report
pnpm test:coverage

# Testes específicos
pnpm test -- tracking
```

## 📊 Logs e Monitoramento

### Logs Estruturados

O sistema usa logger personalizado com:

- ✅ Níveis (info, warn, error, debug)
- ✅ Correlação de requisições
- ✅ Sanitização de dados sensíveis
- ✅ Métricas de performance

### Exemplos de Logs

```
✓ Todas as variáveis de ambiente obrigatórias estão configuradas
✓ API rodando na porta 3000
✓ Banco de dados conectado com sucesso
✓ Job de rastreamento automático iniciado
✓ Novo token dos Correios gerado com sucesso

Tracking AA123456789BR atualizado: Objeto postado → Objeto saiu para entrega
Email de Saiu para entrega enviado para cliente@email.com (template: Saiu para entrega)

⚠️ Status desconhecido detectado dos Correios: "Status Novo"
❌ Erro ao gerar token dos Correios: 401 - Unauthorized
```

## 🚀 Deploy

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Variáveis de Produção

```env
NODE_ENV=production
PORT=3000
# ... demais variáveis
```

## 🤝 Contribuição

### Padrões de Código

- Comentários em **PT-BR** para facilitar manutenção
- TypeScript strict mode
- Clean Architecture principles
- Testes obrigatórios para novas features

### Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 📄 Licença

Este projeto está sob a licença ISC.

---

**Desenvolvido com ❤️ usando Clean Architecture e TypeScript**

**Última atualização**: Janeiro 2025 - Sistema totalmente auditado e otimizado com suporte a Handlebars
