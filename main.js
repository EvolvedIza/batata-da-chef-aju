// js/main.js
// Responsável por: carregar produtos e categorias do Supabase,
// renderizar home (mais vendidos) e cardápio, filtrar categorias,
// e configurar todos os links de WhatsApp/iFood.

let _produtosCache = [];
let _categoriasCache = [];
let _categoriaAtual = 'todas';

document.addEventListener('DOMContentLoaded', async () => {
  await carregarConfiguracoes();
  await carregarCategorias();
  await carregarProdutos();

  const pagina = document.body.dataset.pagina || detectarPagina();
  if (pagina === 'home') renderHome();
  if (pagina === 'cardapio') renderCardapio();
});

function detectarPagina() {
  return location.pathname.includes('cardapio') ? 'cardapio' : 'home';
}

// ============================================================
// CONFIGURAÇÕES (WhatsApp, iFood)
// ============================================================
async function carregarConfiguracoes() {
  const numero = '5579981515981'; // <-- seu WhatsApp
  const ifood = 'https://www.ifood.com.br/delivery/aracaju-se/batata-da-chef-suica/0bd7668c-3a53-4fca-9673-981aef057715';

  const msgPadrao = encodeURIComponent('Olá! Gostaria de fazer um pedido no Batata da Chef Aju 🥔');
  const waUrl = `https://wa.me/${numero}?text=${msgPadrao}`;

  ['btnWhatsAppHero','btnWhatsAppContato','btnWhatsAppFooter','btnWhatsAppFlutuante'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = waUrl;
  });

  ['btnIfoodHero','btnIfoodContato','btnIfoodFooter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = ifood;
  });
}

// ============================================================
// CATEGORIAS
// ============================================================
async function carregarCategorias() {
  try {
    const { data, error } = await db
      .from('categorias')
      .select('id, nome, ordem')
      .order('ordem', { ascending: true });
    if (error) throw error;
    _categoriasCache = data || [];
    renderCategoriasBotoes();
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
  }
}

function renderCategoriasBotoes() {
  const cont = document.getElementById('categoriasBtns');
  if (!cont) return;

  cont.innerHTML = _categoriasCache.map(c => `
    <button class="cat-btn" data-categoria="${c.id}">${escapeHtml(c.nome)}</button>
  `).join('');

  const nav = document.querySelector('.categorias-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;

    nav.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    _categoriaAtual = btn.dataset.categoria || 'todas';
    renderCardapio();
  });
}

// ============================================================
// PRODUTOS
// ============================================================
async function carregarProdutos() {
  // Lê do catálogo fixo (js/produtos.js)
  _produtosCache = [...window.CATALOGO_PRODUTOS]
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

async function carregarCategorias() {
  // Lê do catálogo fixo
  _categoriasCache = [...window.CATALOGO_CATEGORIAS]
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  renderCategoriasBotoes();
}

function nomeCategoria(produto) {
  return produto?.categoria || produto?.categorias?.nome || '—';
}

// ============================================================
// CARD DE PRODUTO (reutilizável)
// ============================================================
function criarCardProduto(p) {
  const indisponivel = !p.disponivel;
  const img = p.imagem_url || 'images/placeholder.jpg';

  const noCarrinho = window.Cart?.itens?.find(i => String(i.id) === String(p.id));
  const qtd = noCarrinho ? noCarrinho.qtd : 0;

  const controles = qtd > 0
    ? `
      <div class="card-qtd-controles">
        <button class="card-qtd-btn" data-add-produto="${p.id}" aria-label="Aumentar">+</button>
        <span class="card-qtd-num">${qtd}</span>
        <button class="card-qtd-btn" data-remove-produto="${p.id}" aria-label="Diminuir">−</button>
        <button class="card-x-btn" data-x-produto="${p.id}" aria-label="Remover do carrinho">✕</button>
      </div>
    `
    : `
      <button
        class="card-btn"
        data-add-produto="${p.id}"
        ${indisponivel ? 'disabled' : ''}
        aria-label="Adicionar ${escapeHtml(p.nome)} ao carrinho">
        ${indisponivel ? 'Esgotado' : 'Adicionar'}
      </button>
    `;

  return `
    <article class="card-produto">
      <div class="card-imagem">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(p.nome)}" loading="lazy" />
        ${indisponivel ? '<div class="card-indisponivel">Indisponível</div>' : ''}
      </div>
      <div class="card-body">
        <span class="card-cat">${escapeHtml(nomeCategoria(p))}</span>
        <h3 class="card-nome">${escapeHtml(p.nome)}</h3>
        <p class="card-desc">${escapeHtml(p.descricao || '')}</p>
        <div class="card-footer">
          <span class="card-preco">${formatarPreco(p.preco)}</span>
          ${controles}
        </div>
      </div>
    </article>
  `;
}

// ============================================================
// HOME — MAIS VENDIDOS
// ============================================================
function renderHome() {
  const grid = document.getElementById('gridMaisVendidos');
  if (!grid) return;

  // Como não há tabela de vendas, exibe os 6 primeiros disponíveis por ordem.
  // Quando você tiver tracking de vendas, basta ordenar por popularidade.
  const disponiveis = _produtosCache.filter(p => p.disponivel).slice(0, 6);

  if (disponiveis.length === 0) {
    grid.innerHTML = '<div class="vazio"><p>Nenhum produto disponível no momento.</p></div>';
    return;
  }
  grid.innerHTML = disponiveis.map(criarCardProduto).join('');
  ligarBotoesAdicionar();
}

// ============================================================
// CARDÁPIO — LISTA + FILTRO
// ============================================================
function renderCardapio() {
  const grid = document.getElementById('gridCardapio');
  const vazio = document.getElementById('cardapioVazio');
  if (!grid) return;

  let lista = _produtosCache;

  if (_categoriaAtual && _categoriaAtual !== 'todas') {
    lista = lista.filter(p => String(p.categoria_id) === String(_categoriaAtual));
  }

  if (lista.length === 0) {
    grid.innerHTML = '';
    if (vazio) vazio.hidden = false;
    return;
  }

  if (vazio) vazio.hidden = true;
  grid.innerHTML = lista.map(criarCardProduto).join('');
  ligarBotoesAdicionar();
}

// ============================================================
// BOTÕES "ADICIONAR AO CARRINHO"
// ============================================================
function ligarBotoesAdicionar() {
  const rerender = () => {
    const pagina = document.body.dataset.pagina || detectarPagina();
    if (pagina === 'home') renderHome();
    if (pagina === 'cardapio') renderCardapio();
  };

  document.querySelectorAll('[data-add-produto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const produto = _produtosCache.find(p => String(p.id) === String(btn.dataset.addProduto));
      if (produto && window.Cart) { window.Cart.adicionar(produto); rerender(); }
    });
  });

  document.querySelectorAll('[data-remove-produto]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.Cart) { window.Cart.diminuir(btn.dataset.removeProduto); rerender(); }
    });
  });

  document.querySelectorAll('[data-x-produto]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.Cart) { window.Cart.remover(btn.dataset.xProduto); rerender(); }
    });
  });
}

// ============================================================
// HELPERS
// ============================================================
function formatarPreco(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Expõe helpers para cart.js
window.formatarPreco = formatarPreco;
window.escapeHtml = escapeHtml;
