# 📱 FinApp - Controle Financeiro Pessoal

[![React Native](https://img.shields.io/badge/React_Native-0.86.3-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-57.0.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-~6.0.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-expo--sqlite-003B57?logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-2ECC71)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

> Aplicação intuitiva para gestão de finanças pessoais, projetada para proporcionar controle financeiro claro e transparente de receitas, despesas à vista e parceladas, faturas de cartão de crédito e contas fixas recorrentes.

---

## 📑 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Regras e Convenções de Domínio](#-regras-e-convenções-de-domínio)

---

## 🎯 Visão Geral

O **FinApp** é uma solução completa para organização orçamentária pessoal. A plataforma centraliza o planejamento do orçamento mensal, calculando em tempo real o saldo disponível, o percentual de comprometimento da renda e o fluxo futuro de compras parceladas no cartão de crédito.

Os dados do usuário são persistidos e processados de forma independente no próprio ambiente de execução (utilizando SQLite nativo / WebAssembly local), garantindo autonomia e privacidade individual de cada usuário.

---

## ✨ Funcionalidades

### 1. 📊 Dashboard Financeiro
- **Resumo Mensal**: Acompanhamento dinâmico de **Receitas**, **Despesas** e **Saldo Líquido**.
- **Salário / Renda Fixa Persistente**: Configuração de renda mensal recorrente com dia de recebimento programado.
- **Termômetro de Renda Comprometida**: Indicador de comprometimento orçamentário com faixas de classificação intuitivas.
- **Média de Sobra Mensal**: Histórico comparativo de capacidade de poupança mensal.
- **Gráfico de Gastos por Categoria**: Visualização visual em gráfico de rosca (SVG) da divisão de despesas.
- **Navegação Temporal**: Transição fluida entre meses anteriores e futuros.

### 2. 💳 Gestão de Cartão de Crédito & Faturas
- **Ciclo Inteligente ("Melhor Dia de Compra")**: Parametrização dos dias de fechamento e vencimento, direcionando compras pós-fechamento para a fatura seguinte.
- **Status das Faturas**: Controle do ciclo de cada fatura (*Aberta*, *Fechada* ou *Paga*).
- **Antecipação de Parcelas**: Opção de adiantar parcelas futuras de compras diretamente na fatura vigente, com suporte a desconto.

### 3. 🔄 Contas Fixas e Recorrentes
- **Materialização Automática**: Contas recorrentes (aluguel, assinaturas, contas de consumo) lançadas automaticamente ao navegar no mês.
- **Calendário Inteligente**: Ajuste de datas para meses com menos de 31 dias e anos bissextos.
- **Edição Flexível**: Opções para atualizar a ocorrência única, as ocorrências futuras ou a regra completa.

### 4. 🛍️ Transações à Vista e Parceladas
- Registro de despesas e receitas com identificação por categoria e meio de pagamento (`PIX`, `Cartão de Crédito`, `Débito`, `Dinheiro`, `Boleto`).
- Gestão de parcelamentos agrupados, permitindo visualização da evolução das parcelas e quitação antecipada.

### 5. 🏷️ Categorias Customizáveis
- Categorias pré-configuradas com personalização de cores e ícones.
- Controle de integridade para evitar a remoção de categorias vinculadas a despesas fixas ativas.

### 6. 🔐 Segurança por Código PIN
- Bloqueio de acesso por código numérico de 4 dígitos.
- Criptografia com algoritmo **SHA-256** e **Salt aleatório**, protegendo o acesso local aos dados.

### 7. 💾 Backup & Restauração de Dados
- Exportação dos dados orçamentários em formato JSON estruturado.
- Restauração atômica com validação prévia de integridade dos registros.

---

## 🛠️ Tecnologias Utilizadas

| Componente | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) / [React Native Web](https://necolas.github.io/react-native-web/) | Interface reativa e multiplataforma |
| **Plataforma** | [Expo SDK 57](https://expo.dev/) | Tooling e ambiente de compilação |
| **Roteamento** | [Expo Router](https://docs.expo.dev/router/introduction/) | Navegação estruturada em arquivos |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) | Tipagem estática rigorosa |
| **Banco de Dados** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) | Persistência relacional local via SQLite / WASM |
| **Criptografia** | [expo-crypto](https://docs.expo.dev/versions/latest/sdk/crypto/) | Hashing seguro SHA-256 com Salt |
| **Gráficos** | [react-native-svg](https://github.com/software-mansion/react-native-svg) | Renderização de gráficos vetoriais |

---

## 🏛️ Arquitetura do Projeto

O projeto adota os princípios da **Clean Architecture**, mantendo a lógica de negócios desacoplada de bibliotecas visuais ou infraestrutura:

```
src/
├── core/                         # Utilitários globais e funções matemáticas puras
├── domain/                       # Camada de Domínio (Entidades, Interfaces e Casos de Uso)
│   ├── entities/                 # Modelos do negócio (Transaction, Category, Invoice, etc.)
│   ├── repositories/             # Contratos de interfaces agnósticos de banco
│   └── usecases/                 # Regras de cálculo, parcelamento e gestão financeira
├── data/                         # Camada de Persistência
│   ├── database/                 # Conexão SQLite e controle de migrações
│   └── repositories/             # Implementação concreta dos repositórios
└── presentation/                 # Camada Visual
    ├── components/               # Componentes de UI (gráficos, cards, modais)
    ├── di/                       # Injeção de dependências
    └── theme/                    # Paleta de cores e tipografia
app/                              # Rotas e telas da aplicação (Expo Router)
```

---

## 📐 Regras e Convenções de Domínio

### 1. Manipulação Monetária em Centavos
Para evitar inconsistências típicas de operações com ponto flutuante em JavaScript:
- Todos os cálculos monetários e registros no banco utilizam números inteiros representando centavos:
  - Exemplo: `R$ 50,00` $\rightarrow$ `5000` centavos
  - Exemplo: `R$ 1.250,90` $\rightarrow$ `125090` centavos

### 2. Divisão Exata de Parcelas
No parcelamento de valores com dízimas ou restos centesimais (exemplo: R$ 100,00 em 3 parcelas):
- O valor base é calculado arredondando para baixo: `Math.floor(10000 / 3) = 3333` (R$ 33,33).
- O centavo remanescente (`10000 % 3 = 1`) é incorporado integralmente na **1ª parcela**:
  - Parcela 1: `R$ 33,34`
  - Parcela 2: `R$ 33,33`
  - Parcela 3: `R$ 33,33`
  - Total: exatamente `R$ 100,00`, sem desvios centesimais.
