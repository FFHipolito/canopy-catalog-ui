# 📖 Escolhas Técnicas do Projeto

Este documento explica de forma simples e direta o **porquê** de cada tecnologia e padrão escolhido na construção do **Canopy Catalog UI**.

---

## 1. Next.js (App Router) + TypeScript
- **Next.js com App Router:**
  - Foi escolhido por oferecer um ambiente completo para React, com renderização otimizada, roteamento moderno e geração estática de páginas.
  - Permite separar o que é conteúdo estático (`layout.tsx`) do que precisa de interação no navegador (`'use client'`), melhorando o tempo de carregamento inicial.
- **TypeScript:**
  - Garante tipagem estrita para produtos, filtros, paginação e respostas de API.
  - Evita erros comuns em tempo de desenvolvimento (como acessar propriedades inexistentes ou passar tipos incompatíveis) e facilita futuras refatorações.

---

## 2. Tailwind CSS
- **Por que usamos:**
  - Permite estilizar componentes rapidamente usando classes utilitárias diretamente no JSX, sem necessidade de arquivos CSS separados para cada componente.
  - Garante consistência visual de espaçamentos, cores e tipografia.
  - Elimina CSS não utilizado no build final, resultando em arquivos leves e rápidos para o navegador carregar.

---

## 3. Zustand (Gerenciamento de Estado Global)
- **Por que não Context API?**
  - O `Context API` do React re-renderiza todos os componentes consumidores quando qualquer valor muda. Na barra de busca, por exemplo, digitar uma letra re-renderizaria a paginação e o formulário sem necessidade.
- **Por que não Redux?**
  - O Redux exige muito código repetitivo (*boilerplate*) como actions, reducers, dispatchers e configuração de store complexa.
- **Vantagens do Zustand:**
  - É extremamente leve (~1.2kB).
  - Permite que cada componente assine apenas o pedaço de estado que realmente usa (ex: a paginação só atualiza quando a página muda).
  - Não precisa envolver a aplicação em `<Provider>`, integrando perfeitamente com o Next.js.
  - Permite calcular listas filtradas e dados de paginação na hora (*seletores computados*), sem duplicar dados na memória.

---

## 4. React Hook Form + Zod (Formulários e Validação)
- **React Hook Form:**
  - Gerencia o formulário de forma não-controlada (*uncontrolled*), o que significa que o React não re-renderiza todo o modal a cada caractere digitado.
- **Zod:**
  - Define o contrato do produto (nome com no mínimo 3 caracteres, preço positivo, URL válida e descrição preenchida).
  - Se os dados estiverem incorretos, o formulário não é enviado e mensagens claras aparecem logo abaixo do campo com erro.

---

## 5. Camada de Serviço Desacoplada (`productService.ts`)
- **Por que desacoplar a busca de dados da tela?**
  - A interface de usuário não faz chamadas diretas ou manipulações brutas de array. Ela consome o `productService`.
  - O serviço simula uma espera de rede real (latência assíncrona com `delay`) para demonstrar o estado de carregamento (*loading/skeletons*).
  - **Pronto para backend real:** Quando a API (por exemplo, em NestJS) estiver pronta, basta trocar a implementação interna do serviço para fazer um `fetch('/api/products')`. Nenhuma tela ou componente precisará ser alterado.

---

## 6. Skeletons e Debounce (Experiência do Usuário)
- **ProductSkeleton (Prevenção de CLS):**
  - Em vez de um simples spinner girando no centro da tela, usamos blocos cinzas pulsantes que têm exatamente o mesmo formato dos cards reais.
  - Isso evita o *Layout Shift* (quando a página "pula" ao carregar as informações), tornando a navegação mais agradável e estável.
- **Debounce de 300ms na Busca:**
  - Ao digitar no campo de busca, o texto no input atualiza imediatamente, mas o filtro só é aplicado 300 milissegundos após o usuário parar de digitar.
  - Isso evita processar filtros pesados a cada tecla pressionada.

---

## 7. Testes Automatizados com Jest e React Testing Library
- **Teste de Snapshot:**
  - Garante que a estrutura visual e classes do `ProductCard` não sejam alteradas por acidente em alterações futuras.
- **Testes de Validação do Formulário:**
  - Testam o comportamento real: tentar salvar em branco exibe os erros; tentar salvar com preço negativo bloqueia; preencher corretamente adiciona o produto.
- **Testes de Filtros:**
  - Garantem que a busca textual com debounce e os botões de categoria e reset filtram corretamente a lista exibida.

---

## 8. Identidade Visual e Experiência do Usuário (UX)
- **Alternador de Tema (Modo Claro / Modo Escuro):**
  - Permite que o usuário escolha entre o Modo Claro (padrão amigável e suave com fundo claro) e o Modo Escuro com um simples clique no topo. A escolha fica salva no navegador.
- **Descrição com "mais" / "menos":**
  - Mantém o alinhamento visual dos cards em 2 linhas, permitindo que o usuário clique em "mais" para ler o texto completo sem sair da página.
- **Ícone da Árvore (Favicon):**
  - O ícone padrão do Next.js na aba do navegador foi substituído pela árvore Canopy em formato SVG e ICO, trazendo acabamento profissional e identidade visual completa.

