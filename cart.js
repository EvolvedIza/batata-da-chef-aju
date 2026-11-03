// js/cart.js
// Carrinho persistido em localStorage por dispositivo (sessão de compra).
// Os PRODUTOS ficam no Supabase; apenas o carrinho em andamento fica local.

const CART_KEY = 'batata_chef_aju_cart_v1';

const Cart = {
  itens: [],

  carregar() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      this.itens = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(this.itens)) this.itens = [];
    } catch { this.itens = []; }
    this._render();
  },

  salvar() {
    localStorage.setItem(CART_KEY, JSON.stringify(this.itens));
    this._render();
  },

  adicionar(produto) {
    if (!produto || !produto.disponivel) {
      mostrarToast('Este produto está indisponível no momento.');
      return;
    }
    const existente = this.itens.find(i => i.id === produto.id);
    if (existente) {
      existente.qtd += 1;
    } else {
      this.itens.push({
        id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco),
        imagem_url: produto.imagem_url || '',
        qtd: 1
      });
    }
    this.salvar();
    mostrarToast(`"${produto.nome}" adicionado ao carrinho 🛒`);
  },

  aumentar(id) {
    const item = this.itens.find(i => i.id === id);
    if (!item) return;
    item.qtd += 1;
    this.salvar();
  },

  diminuir(id) {
    const item = this.itens.find(i => i.id === id);
    if (!item) return;
    item.qtd -= 1;
    if (item.qtd <= 0) {
      this.itens = this.itens.filter(i => i.id !== id);
    }
    this.salvar();
  },

  remover(id) {
    this.itens = this.itens.filter(i => i.id !== id);
    this.salvar();
  },

  limpar() {
    this.itens = [];
    this.salvar();
  },

  total() {
    return this.itens.reduce((s, i) => s + i.preco * i.qtd, 0);
  },

  quantidadeTotal() {
    return this.itens.reduce((s, i) => s + i.qtd, 0);
  },

  _render() {
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = this.quantidadeTotal();

    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = formatarPreco(this.total());

    const lista = document.getElementById('cartItems');
    if (!lista) return;

    if (this.itens.length === 0) {
      lista.innerHTML = '<p class="cart-empty">Seu carrinho está vazio.</p>';
      return;
    }

    lista.innerHTML = this.itens.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.imagem_url || 'images/placeholder.jpg'}" alt="${escapeHtml(item.nome)}" loading="lazy" />
        <div class="cart-item-info">
          <div class="cart-item-nome">${escapeHtml(item.nome)}</div>
          <div class="cart-item-preco">${formatarPreco(item.preco)} cada</div>
          <div class="cart-item-qtd">
            <button class="qtd-btn" data-acao="diminuir" aria-label="Diminuir">−</button>
            <span>${item.qtd}</span>
            <button class="qtd-btn" data-acao="aumentar" aria-label="Aumentar">+</button>
          </div>
        </div>
        <div style="text-align:right">
          <div class="cart-item-subtotal">${formatarPreco(item.preco * item.qtd)}</div>
          <button class="cart-item-remove" data-acao="remover">remover</button>
        </div>
      </div>
    `).join('');
  }
};

// ============================================================
// HELPERS
// ============================================================
function formatarPreco(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function mostrarToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(mostrarToast._timer);
  mostrarToast._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ============================================================
// DELEGAÇÃO DE EVENTOS DO CARRINHO
// ============================================================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-acao]');
  if (!btn) return;
  const id = btn.closest('[data-id]')?.dataset.id;
  if (!id) return;
  const acao = btn.dataset.acao;
  if (acao === 'aumentar') Cart.aumentar(id);
  else if (acao === 'diminuir') Cart.diminuir(id);
  else if (acao === 'remover') Cart.remover(id);
});

// ============================================================
// ABRIR/FECHAR CARRINHO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  Cart.carregar();

  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  const openBtn = document.getElementById('cartToggle');
  const closeBtn = document.getElementById('cartClose');

  function abrir() {
    drawer?.classList.add('open');
    drawer?.setAttribute('aria-hidden', 'false');
    if (backdrop) { backdrop.hidden = false; requestAnimationFrame(() => backdrop.classList.add('show')); }
  }
  function fechar() {
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    if (backdrop) {
      backdrop.classList.remove('show');
      setTimeout(() => { backdrop.hidden = true; }, 300);
    }
  }

  openBtn?.addEventListener('click', abrir);
  closeBtn?.addEventListener('click', fechar);
  backdrop?.addEventListener('click', fechar);

  // ============================================================
  // FINALIZAR PEDIDO → WHATSAPP
  // ============================================================
  const form = document.getElementById('formPedido');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (Cart.itens.length === 0) {
      mostrarToast('Adicione produtos ao carrinho antes de finalizar.');
      return;
    }
    const nome = document.getElementById('clienteNome').value.trim();
    const endereco = document.getElementById('clienteEndereco').value.trim();
    const obs = document.getElementById('pedidoObs').value.trim();
    if (!nome || !endereco) {
      mostrarToast('Preencha nome e endereço.');
      return;
    }

    // Busca número do WhatsApp configurado no Supabase
    let numero = '';
    try {
      const { data, error } = await db
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'whatsapp')
        .single();
      if (!error && data) numero = String(data.valor).replace(/\D/g, '');
    } catch (err) {
      console.error('Erro ao buscar WhatsApp:', err);
    }

    if (!numero) {
      mostrarToast('WhatsApp não configurado. Contate o restaurante.');
      return;
    }

    const linhas = [];
    linhas.push('*NOVO PEDIDO — Batata da Chef Aju*');
    linhas.push('');
    linhas.push(`*Cliente:* ${nome}`);
    linhas.push(`*Endereço:* ${endereco}`);
    linhas.push('');
    linhas.push('*Itens:*');
    Cart.itens.forEach(i => {
      linhas.push(`• ${i.qtd}x ${i.nome} — ${formatarPreco(i.preco * i.qtd)}`);
    });
    linhas.push('');
    linhas.push(`*Total: ${formatarPreco(Cart.total())}*`);
    linhas.push('*Entrega: GRÁTIS*');
    if (obs) {
      linhas.push('');
      linhas.push(`*Observações:* ${obs}`);
    }

    const msg = encodeURIComponent(linhas.join('\n'));
    const url = `https://wa.me/${numero}?text=${msg}`;
    window.open(url, '_blank');

    Cart.limpar();
    form.reset();
    fechar();
  });
});