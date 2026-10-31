# 🎟️ Rifas Online — Plataforma de Rifas e Sorteios Ao Vivo

Plataforma completa de Rifas Online moderna, de alta conversão e 100% responsiva (otimizada para Mobile/Tablets e empacotamento Android/Capacitor para Google Play Store).

---

## 🚀 Arquitetura & Stack Tecnológica
- **Backend:** Java 17/21, Spring Boot 3+, Spring Data JPA, PostgreSQL (Produção: `93.127.212.65:3007`), Spring Security com JWT, WebSocket (STOMP/SockJS), HikariCP.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti, StompJS/SockJS.
- **Produção:** `https://clube.logistadigital.com.br/` (Hospedado no Coolify com Dockerfile multi-stage).
- **Mobile:** Suporte nativo a Capacitor via `capacitor.config.ts`.

---

## 🛠️ Como Subir o Projeto

### Opção 1: Subir em Produção via Git & Coolify (Recomendado)
O projeto já está configurado no Coolify sob a URL **https://clube.logistadigital.com.br**.

1. Faça commit e push das alterações para o repositório GitHub:
   ```bash
   git add .
   git commit -m "feat: plataforma completa de rifas online com sorteio ao vivo e painel admin"
   git push origin main
   ```
2. O Coolify detectará o push e executará o `Dockerfile` multi-stage automaticamente (ou acione o deploy pelo painel Coolify).

---

### Opção 2: Subir Localmente com Docker Compose
Para rodar a aplicação completa (Backend + Frontend embutido) localmente:
```bash
docker compose up --build -d
```
Acesse em: `http://localhost:8080`

---

### Opção 3: Subir em Modo de Desenvolvimento (Hot-Reload)

#### 1. Iniciar o Backend (Spring Boot na porta 8080):
```bash
cd rifas-api
mvn spring-boot:run
```
O backend conectará no PostgreSQL de produção configurado em `application-prod.properties` e iniciará o servidor com WebSocket e agendador de sorteios automáticos.

#### 2. Iniciar o Frontend (Vite na porta 5173):
```bash
cd rifas-web
npm install
npm run dev
```
Acesse em: `http://localhost:5173` (as requisições `/api` e `/ws` são redirecionadas automaticamente para o backend na porta 8080).

---

## 🔑 Credenciais Administrativas do Sistema

### Administrador Master:
- **CPF:** `00741052130` (ou `007.410.521-30`)
- **Senha:** `00741052130`
- **Acesso:** Libera o botão **"Painel Admin"** no topo da página.

---

## 🎯 Funcionalidades Principais
1. **Vitrine Pública & Carrossel de Alta Conversão:** Acesso livre sem exigir login, fotos em alta resolução, badges "Em breve", "Ao Vivo" e "Encerrado".
2. **Histórico Oficial dos Últimos 10 Sorteios:** Exibição com comprovante criptográfico SHA-256 e mascaramento de dados (LGPD):
   - CPF: `12******3456`
   - Telefone: `(XX) XXXXX-1234`
3. **Fluxo de Compra Inteligente por CPF:**
   - Consulta imediata se o CPF já existe na base.
   - Se já cadastrado: solicita senha.
   - Se novo: abre formulário de cadastro com CPF travado para segurança.
4. **Módulo Bancário Pix Dinâmico:** QR Code e chave Copia e Cola com botão de simulação para liberação instantânea de bilhetes.
5. **Transmissão Ao Vivo com Roleta e WebSocket:** Cronômetro regressivo de impacto que dispara o sorteio automaticamente ao zerar o tempo para todos os usuários conectados.
6. **Painel Admin Exclusivo (`ROLE_ADMIN`):**
   - Botão **"Sortear Agora"**.
   - **Modo Livre (Aleatório):** Sorteio aleatório entre cotas pagas.
   - **Modo Direcionado (Controle Admin):** Seleciona previamente o CPF concorrente vencedor.
   - Visualização irrestrita de dados completos do ganhador (CPF completo, telefone real, nascimento, cotas).

