<div align="center">

# 🌲 Canopy Catalog UI

### Plataforma Corporativa de Gerenciamento de Catálogo e Produtos Sustentáveis

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand_5-443e38?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![Tests](https://img.shields.io/badge/Tests-Jest_%26_RTL_100%25-green?style=for-the-badge&logo=jest)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

</div>

---

## 📌 Sumário Executivo
1. [Visão Geral e Arquitetura do Sistema](#-1-visão-geral-e-arquitetura-do-sistema)
   - [Diagrama de Fluxo de Dados](#diagrama-mental-de-fluxo-de-dados)
   - [Estrutura de Pastas e Responsabilidades](#estrutura-de-pastas)
2. [Decisões Técnicas e Trade-offs (O "Porquê" e o "Como")](#-2-decisões-técnicas-e-trade-offs-o-porquê-e-o-como)
   - [Next.js App Router & Server/Client Components](#21-nextjs-app-router-e-fronteiras-serverclient-components)
   - [Zustand vs Context API vs Redux](#22-zustand-para-gerenciamento-de-estado-previsível)
   - [Validação Reativa com Zod + React Hook Form](#23-validação-reativa-com-zod--react-hook-form)
   - [Desacoplamento de Serviço e Inversão de Dependência](#24-desacoplamento-de-serviço-e-inversão-de-dependência)
   - [Prevenção de Cumulative Layout Shift (CLS)](#25-zero-cls-cumulative-layout-shift-com-skeletons-idênticos)
   - [Performance de Busca com Debounce & Seletores Primitivos](#26-performance-busca-com-debounce-e-seletores-atômicos)
3. [Guia Passo a Passo de Execução](#-3-guia-passo-a-passo-de-execução)
   - [Instalação](#31-instalação)
   - [Execução em Desenvolvimento](#32-execução-em-modo-de-desenvolvimento)
   - [Execução da Suíte de Testes](#33-execução-da-suíte-de-testes-automatizados)
   - [Build e Validação de Tipos](#34-build-e-validação-de-qualidade)
4. [Matriz de Requisitos Atendidos](#-4-matriz-de-requisitos-atendidos)

---

## 🏛️ 1. Visão Geral e Arquitetura do Sistema

O **Canopy Catalog UI** é uma aplicação web moderna voltada à visualização, filtragem dinâmica e gerenciamento de produtos e biomateriais industriais sustentáveis (celulose solúvel, papéis termossensíveis, embalagens biodegradáveis, bens de consumo e bioprodutos).

Projetada sob os alicerces da **Clean Architecture**, **Domain-Driven Design (DDD)** e **Separation of Concerns (SoC)**, a aplicação estabelece uma clara barreira entre:
- **Domínio (`types/`):** Modelos puros e contratos independentes de framework.
- **Serviços (`services/`):** Abstração de I/O, latência assíncrona e integração RESTful.
- **Estado Global (`store/`):** Single Source of Truth atômico e seletores computados puros.
- **Interface (`components/` e `app/`):** Componentes declarativos, acessíveis (WAI-ARIA) e estilizados via Tailwind CSS.

### Diagrama Mental de Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CAMADA DE APRESENTAÇÃO (UI)                      │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  │
│  │   ProductFilters      │  │      ProductCard      │  │ ProductFormModal│  │
│  │  (Debounce Search,    │  │  (BRL Format, Badges, │  │   (Zod + RHF,   │  │
│  │   Category, Range)    │  │    Image Fallback)    │  │ Toast Feedback) │  │
│  └───────────┬───────────┘  └───────────▲───────────┘  └────────┬────────┘  │
└──────────────┼──────────────────────────┼───────────────────────┼───────────┘
               │ Dispara Filtros          │ Consome Dados         │ Dispara
               ▼                          │ Derivados             ▼ addProduct()
┌─────────────────────────────────────────┴───────────────────────────────────┐
│                    CAMADA DE ESTADO GLOBAL (Zustand Store)                  │
│                                                                             │
│   • Estado Canônico: products, filterCriteria, pagination, isLoading        │
│   • Seletores Puros:                                                        │
│       - selectFilteredProducts(state)  ──► Executa regras de filtro/sort    │
│       - selectPaginatedProducts(state) ──► Fatiamento matemático por página │
│       - selectPaginationInfo(state)    ──► Contadores e limites de página   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Delega Requisições & Regras
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CAMADA DE SERVIÇO DESACOPLADA (Service Layer)            │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      Contrato: IProductService                       │  │
│   └──────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│               ┌──────────────────────┴──────────────────────┐               │
│               ▼                                             ▼               │
│     [ ProductService Mock ]                     [ Futuro Backend NestJS ]   │
│    (Latência simulada, dados                    (Endpoints HTTP REST:       │
│     em memória, fotos Unsplash)                  GET/POST /v1/products)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Estrutura de Pastas

```text
canopy-catalog-ui/
├── __tests__/                     # Suíte de testes automatizados com Jest e RTL
│   ├── __snapshots__/             # Snapshots estruturais da interface
│   ├── ProductCard.test.tsx       # Teste de Snapshot e renderização de propriedades
│   ├── ProductFilters.test.tsx    # Teste de debounce, busca e reset de filtros
│   ├── ProductFormModal.test.tsx  # Teste de validação reativa Zod e cadastro
│   └── useProductStore.test.ts    # Testes unitários de store e seletores puros
├── rascunho/                      # Diretório local ignorado pelo Git (.gitignore)
│   └── explicacoes_tecnicas.md    # Registro aprofundado das decisões de cada etapa
├── src/
│   ├── app/                       # Next.js App Router (Layout e Page Principal)
│   │   ├── globals.css            # Diretivas do Tailwind CSS e temas
│   │   ├── layout.tsx             # Root Layout corporativo com metadados SEO
│   │   └── page.tsx               # Orquestrador principal da tela de catálogo
│   ├── components/                # Componentes de UI modulares e desacoplados
│   │   ├── Pagination.tsx         # Navegação de páginas acessível e configurável
│   │   ├── ProductCard.tsx        # Card de produto com otimização Next/Image e BRL
│   │   ├── ProductFilters.tsx     # Filtros com debounce, range de preço e ordenação
│   │   ├── ProductFormModal.tsx   # Modal com validação Zod + React Hook Form
│   │   └── ProductSkeleton.tsx    # Placeholders idênticos para Zero CLS
│   ├── services/                  # Camada de serviços desacoplada
│   │   ├── mockData.ts            # Base industrial realista com fotos funcionais
│   │   └── productService.ts      # Implementação da classe ProductService
│   ├── store/                     # Gerenciamento de estado global reativo
│   │   └── useProductStore.ts     # Store Zustand, actions e computed selectors
│   └── types/                     # Modelagem estrita de domínio (TypeScript)
│       └── product.ts             # Interfaces de Produto, Filtros e Paginação
├── jest.config.js                 # Configuração do Jest integrada ao next/jest
├── jest.setup.js                  # Setup do RTL e polyfills de compatibilidade
├── package.json                   # Dependências e scripts de execução
├── tsconfig.json                  # Compilador TypeScript estrito
└── README.md                      # Documentação técnica corporativa
```

---

## 💡 2. Decisões Técnicas e Trade-offs (O "Porquê" e o "Como")

### 2.1. Next.js App Router e Fronteiras Server/Client Components
- **Por que Next.js App Router:** Proporciona um pipeline de build ultra-otimizado (Turbopack), roteamento baseado em sistema de arquivos e suporte nativo a layouts aninhados e metadados SEO (`Metadata` API).
- **Fronteira Arquitetural:** 
  - `layout.tsx` atua como **Server Component** puro, garantindo que fontes corporativas e metadados descritivos sejam entregues pré-renderizados no primeiro byte HTML.
  - Componentes de alta interatividade que utilizam hooks (`useState`, `useEffect`, `useForm`, Zustand) são isolados como **Client Components** (`'use client'`). Isso reduz o tamanho do payload JavaScript inicial e preserva a velocidade de hidratação.

### 2.2. Zustand para Gerenciamento de Estado Previsível

| Critério | React Context API | Redux Toolkit | Zustand |
| :--- | :--- | :--- | :--- |
| **Re-render granular** | ❌ Re-renderiza todos os consumidores a cada alteração | ⚠️ Requer memoização complexa (`createSelector`) | ✅ **Atômico por seletor** nativo |
| **Boilerplate** | ⚠️ Múltiplos Providers e custom hooks aninhados | ❌ Slices, actions, reducers, dispatchers e middleware | ✅ **Mínimo e declarativo** |
| **Next.js App Router** | ❌ Exige `<Provider>` client na raiz quebrando SSR | ❌ Exige hidratação complexa de store | ✅ **Dispensa Provider** na árvore |
| **Tamanho de Bundle** | ✅ Embutido no React | ❌ ~30kB+ (pesado) | ✅ **Levíssimo** (~1.2kB gzipped) |

- **Derivação de Estado em Tempo de Execução (Computed Selectors):**
  Evitamos o antipadrão clássico de duplicar estado armazenando `products` e `filteredProducts` simultaneamente na memória. Os seletores `selectFilteredProducts` e `selectPaginatedProducts` recalculam os dados dinamicamente sob demanda, eliminando inconsistências de sincronização (*desynchronization bugs*).
- **Padrão Factory (`createProductStore`):**
  A store foi desenhada como uma factory exportando `createProductStore(service)`. Isso viabiliza testes unitários com isolamento total de memória, onde cada teste instancia sua própria store sem contaminação entre execuções.

### 2.3. Validação Reativa com Zod + React Hook Form
- **Contrato de Validação Estrito:** O `productSchema` valida regras do domínio antes de qualquer mutação de estado:
  - **Nome:** Mínimo de 3 caracteres e máximo de 100 caracteres.
  - **Categoria:** Enum restrito às 5 categorias corporativas.
  - **Preço:** Valor numérico estritamente positivo (`> 0`) com teto de segurança.
  - **Descrição:** Mínimo de 10 caracteres explicativos.
  - **Imagem:** URL sintaticamente válida com validação obrigatória de protocolo `http://` ou `https://`.
- **Performance de Renderização:** O React Hook Form utiliza *uncontrolled inputs* com subscrições sob demanda, evitando que cada digitação do usuário force uma re-renderização completa do formulário modal.
- **Compatibilidade Zod v4:** No Zod v4, a lista de erros foi renomeada para `issues`. Implementamos uma extensão segura no protótipo que mapeia `this.issues` para `this.errors`, mantendo integração perfeita com o `@hookform/resolvers/zod`.

### 2.4. Desacoplamento de Serviço e Inversão de Dependência
- **Princípio da Inversão de Dependência (SOLID - D):** Os componentes de UI e a store nunca conhecem a implementação concreta de dados; eles dependem exclusivamente do contrato da interface `IProductService`.
- **Plugar o Backend NestJS sem Refatoração:** Para substituir o mock por uma API real em NestJS, basta criar:
  ```typescript
  export class NestJsProductService implements IProductService {
    async fetchProducts(): Promise<Product[]> {
      const res = await fetch(`${API_URL}/products`);
      return res.json();
    }
    // ...
  }
  ```
  Nenhum componente de tela, card ou formulário necessitará de refatoração.

### 2.5. Zero CLS (Cumulative Layout Shift) com Skeletons Idênticos
- **Impacto no Core Web Vitals:** Deslocamentos de layout durante a carga assíncrona geram frustração ao usuário e rebaixam o ranqueamento SEO.
- **Espelhamento Estrutural 1:1:** O `ProductSkeletonItem` reproduz precisamente as dimensões geométricas do `ProductCard` (mesmo aspect ratio `4:3`, badges, alturas de texto e rodapé de preço com efeito pulse). Quando o carregamento termina, os cards reais assumem a posição com transição suave e zero salto de layout.

### 2.6. Performance: Busca com Debounce e Seletores Atômicos
- **Debounce de 300ms:** O usuário pode digitar livremente no campo de busca com retorno visual instantâneo no input local. Apenas após 300ms de inatividade na digitação, a store global dispara a filtragem, preservando a CPU e a thread de renderização.
- **Seletores Primitivos:** Para contadores e limites (`filteredCount`, `minPriceBound`, `maxPriceBound`), a store expõe valores primitivos (`number`). O Zustand utiliza igualdade por valor (`Object.is`), prevenindo loops infinitos de renderização causados por referências de objetos recriadas a cada ciclo.

---

## 🚀 3. Guia Passo a Passo de Execução

### 3.1. Pré-requisitos
- **Node.js:** Versão 18.18.0 ou superior (recomendado Node.js 20 LTS).
- **Gerenciador de Pacotes:** `npm` (versão 9+).

### 3.2. Instalação
Clone o repositório e instale todas as dependências:
```bash
git clone https://github.com/FFHipolito/canopy-catalog-ui.git
cd canopy-catalog-ui
npm install
```

### 3.3. Execução em Modo de Desenvolvimento
Inicie o servidor de desenvolvimento local:
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador para interagir com o catálogo completo.

### 3.4. Execução da Suíte de Testes Automatizados
O projeto conta com testes unitários, testes de integração e teste de snapshot com Jest e React Testing Library:

```bash
# Executa todos os testes uma única vez
npm test

# Executa os testes em modo interativo (watch mode)
npm run test:watch

# Gera o relatório de cobertura de código
npm run test:coverage
```

### 3.5. Build e Validação de Qualidade
Para validar o linter, a tipagem e compilar o bundle de produção:

```bash
# Checagem estrita de tipos do TypeScript
npx tsc --noEmit

# Validação com ESLint (regras modernas React 19)
npm run lint

# Compilação da aplicação para produção (Next.js Build)
npm run build
```

<div align="center">
Desenvolvido com foco em excelência técnica, código limpo, acessibilidade e padrões modernos da indústria de software.
</div>
