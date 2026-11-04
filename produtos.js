// js/produtos.js
// Catálogo de produtos fixo no código.
// Edite à vontade: adicione, remova, mude preço, descrição, etc.

const CATALOGO_PRODUTOS = [
  // ============================
  // BATATAS RECHEADAS
  // ============================
  {
    id: 'batata-carne',
    nome: 'Batata Recheada de Carne',
    descricao: 'Batata assada crocante por fora, recheada com carne moída temperada e queijo derretido.',
    preco: 27.90,
    imagem_url: 'images/batata-carne.jpg',
    categoria: 'Batatas Recheadas',
    categoria_id: 'batatas',
    disponivel: true,
    ordem: 1
  },
  {
    id: 'batata-frango',
    nome: 'Batata Recheada de Frango',
    descricao: 'Batata assada recheada com frango desfiado temperado, catupiry e cheiro-verde.',
    preco: 26.90,
    imagem_url: 'images/batata-frango.jpg',
    categoria: 'Batatas Recheadas',
    categoria_id: 'batatas',
    disponivel: true,
    ordem: 2
  },
  {
    id: 'batata-bacon',
    nome: 'Batata Recheada de Bacon',
    descricao: 'Batata assada com bacon crocante, cheddar cremoso e cebolinha.',
    preco: 29.90,
    imagem_url: 'images/batata-bacon.jpg',
    categoria: 'Batatas Recheadas',
    categoria_id: 'batatas',
    disponivel: true,
    ordem: 3
  },
  {
    id: 'batata-camarao',
    nome: 'Batata Recheada de Camarão',
    descricao: 'Batata assada recheada com camarão salteado no alho e limão, catupiry e cheiro-verde.',
    preco: 39.90,
    imagem_url: 'images/batata-camarao.jpg',
    categoria: 'Batatas Recheadas',
    categoria_id: 'batatas',
    disponivel: true,
    ordem: 4
  },

  // ============================
  // MACARRÕES
  // ============================
  {
    id: 'macarrao-branco',
    nome: 'Macarrão ao Molho Branco',
    descricao: 'Macarrão penne com molho branco cremoso, queijo parmesão e cheiro-verde.',
    preco: 22.90,
    imagem_url: 'images/macarrao-branco.jpg',
    categoria: 'Macarrões',
    categoria_id: 'macarroes',
    disponivel: true,
    ordem: 5
  },
  {
    id: 'macarrao-vermelho',
    nome: 'Macarrão ao Molho Vermelho',
    descricao: 'Macarrão penne com molho de tomate caseiro, manjericão e parmesão.',
    preco: 21.90,
    imagem_url: 'images/macarrao-vermelho.jpg',
    categoria: 'Macarrões',
    categoria_id: 'macarroes',
    disponivel: true,
    ordem: 6
  },
  {
    id: 'macarrao-alho-oleo',
    nome: 'Macarrão Alho e Óleo',
    descricao: 'Macarrão espaguete salteado no azeite com alho dourado, pimenta e salsinha.',
    preco: 19.90,
    imagem_url: 'images/macarrao-alho-oleo.jpg',
    categoria: 'Macarrões',
    categoria_id: 'macarroes',
    disponivel: true,
    ordem: 7
  },

  // ============================
  // SOBREMESAS
  // ============================
  {
    id: 'sobremesa-brownie',
    nome: 'Brownie com Sorvete',
    descricao: 'Brownie quentinho de chocolate com bola de sorvete de creme.',
    preco: 15.90,
    imagem_url: 'images/sobremesa-brownie.jpg',
    categoria: 'Sobremesas',
    categoria_id: 'sobremesas',
    disponivel: true,
    ordem: 8
  },
  {
    id: 'sobremesa-pudim',
    nome: 'Pudim de Leite',
    descricao: 'Pudim de leite condensado cremoso com calda de caramelo.',
    preco: 12.90,
    imagem_url: 'images/sobremesa-pudim.jpg',
    categoria: 'Sobremesas',
    categoria_id: 'sobremesas',
    disponivel: true,
    ordem: 9
  },

  // ============================
  // BEBIDAS
  // ============================
  {
    id: 'bebida-refri-lata',
    nome: 'Refrigerante Lata 350ml',
    descricao: 'Coca-Cola, Guaraná, Fanta ou Sprite — escolha no WhatsApp.',
    preco: 6.00,
    imagem_url: 'images/bebida-refri.jpg',
    categoria: 'Bebidas',
    categoria_id: 'bebidas',
    disponivel: true,
    ordem: 10
  },
  {
    id: 'bebida-suco',
    nome: 'Suco Natural 500ml',
    descricao: 'Laranja, limão, abacaxi ou maracujá — feito na hora.',
    preco: 9.90,
    imagem_url: 'images/bebida-suco.jpg',
    categoria: 'Bebidas',
    categoria_id: 'bebidas',
    disponivel: true,
    ordem: 11
  },

  // ============================
  // COMBOS E PROMOÇÕES
  // ============================
  {
    id: 'combo-casal',
    nome: 'Combo Casal',
    descricao: '2 batatas recheadas (à escolha) + 2 refrigerantes lata.',
    preco: 59.90,
    imagem_url: 'images/combo-casal.jpg',
    categoria: 'Combos e Promoções',
    categoria_id: 'combos',
    disponivel: true,
    ordem: 12
  },
  {
    id: 'combo-familia',
    nome: 'Combo Família',
    descricao: '4 batatas recheadas (à escolha) + 1 refrigerante 2L.',
    preco: 109.90,
    imagem_url: 'images/combo-familia.jpg',
    categoria: 'Combos e Promoções',
    categoria_id: 'combos',
    disponivel: true,
    ordem: 13
  }
];

// Categorias fixas (usadas nos filtros do cardápio)
const CATALOGO_CATEGORIAS = [
  { id: 'batatas', nome: 'Batatas Recheadas', ordem: 1 },
  { id: 'macarroes', nome: 'Macarrões', ordem: 2 },
  { id: 'sobremesas', nome: 'Sobremesas', ordem: 3 },
  { id: 'bebidas', nome: 'Bebidas', ordem: 4 },
  { id: 'combos', nome: 'Combos e Promoções', ordem: 5 }
];

// Expõe para o main.js
window.CATALOGO_PRODUTOS = CATALOGO_PRODUTOS;
window.CATALOGO_CATEGORIAS = CATALOGO_CATEGORIAS;