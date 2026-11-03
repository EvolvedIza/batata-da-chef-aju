// js/admin.js
// Painel administrativo: autenticação Supabase, CRUD de produtos,
// upload de imagens, gestão de categorias e configurações.

let usuarioAtual = null;
let produtosCache = [];
let categoriasCache = [];

// ============================================================
// HELPERS
// ============================================================
function toast(msg, tipo = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show' + (tipo ? ' ' + tipo : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = 'toast'; }, 3000);
}
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function formatarPreco(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    usuarioAtual = session.user;
    mostrarPainel();
  } else {
    mostrarLogin();
  }

  db.auth.onAuthStateChange((_event, session) => {
    if (session) {
      usuarioAtual = session.user;
      mostrarPainel();
    } else {
      usuarioAtual = null;
      mostrarLogin();
    }
  });

  configurarLogin();
  configurarNavegacao();
  configurarFormProduto();
  configurarFormConfig();
  configurarFormCategoria();
  configurarModal();
  configurarFiltros();
  configurarLogout();
});

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function configurarLogin() {
  const form = document.getElementById('loginForm');
  const erro = document.getElementById('loginErro');
  const btn = document.getElementById('loginBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erro.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Entrando…';

    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;

    const { error } = await db.auth.signInWithPassword({ email, password: senha });
    btn.disabled = false;
    btn.textContent = 'Entrar';

    if (error) {
      erro.textContent = 'E-mail ou senha incorretos.';
      erro.hidden = false;
      console.error(error);
    }
  });
}

function configurarLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await db.auth.signOut();
    toast('Sessão encerrada.');
  });
}

function mostrarLogin() {
  const l = document.getElementById('loginScreen');
  const a = document.getElementById('adminApp');
  if (l) l.hidden = false;
  if (a) a.hidden = true;
}

function mostrarPainel() {
  const l = document.getElementById('loginScreen');
  const a = document.getElementById('adminApp');
  if (l) l.hidden = true;
  if (a) a.hidden = false;
  const em = document.getElementById('adminEmail');
  if (em) em.textContent = usuarioAtual?.email || '';
  carregarDados();
}

// ============================================================
// NAVEGAÇÃO ENTRE ABAS
// ============================================================
function configurarNavegacao() {
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-tab').forEach(t => t.hidden = true);
      const alvo = document.getElementById('tab-' + tab);
      if (alvo) alvo.hidden = false;
    });
  });
}

// ============================================================
// CARREGAR DADOS
// ============================================================
async function carregarDados() {
  await carregarCategoriasAdmin();
  await carregarProdutosAdmin();
  await carregarConfigAdmin();
}

async function carregarCategoriasAdmin() {
  const { data, error } = await db
    .from('categorias').select('id, nome, ordem').order('ordem');
  if (error) { console.error(error); toast('Erro ao carregar categorias.', 'erro'); return; }
  categoriasCache = data || [];

  const selProd = document.getElementById('prodCategoria');
  const selFiltro = document.getElementById('filtroCategoria');

  if (selProd) {
    selProd.innerHTML = categoriasCache.map(c =>
      `<option value="${c.id}">${escapeHtml(c.nome)}</option>`
    ).join('');
  }
  if (selFiltro) {
    selFiltro.innerHTML = '<option value="">Todas as categorias</option>' +
      categoriasCache.map(c =>
        `<option value="${c.id}">${escapeHtml(c.nome)}</option>`
      ).join('');
  }

  const lista = document.getElementById('listaCategorias');
  if (lista) {
    lista.innerHTML = categoriasCache.length === 0
      ? '<li style="color:#6B7280">Nenhuma categoria ainda.</li>'
      : categoriasCache.map(c => `
          <li>
            <span>${escapeHtml(c.nome)}</span>
            <button data-del-cat="${c.id}">Excluir</button>
          </li>
        `).join('');

    lista.querySelectorAll('[data-del-cat]').forEach(b => {
      b.addEventListener('click', () => excluirCategoria(b.dataset.delCat));
    });
  }
}

async function carregarProdutosAdmin() {
  const { data, error } = await db
    .from('produtos')
    .select('id, nome, descricao, preco, imagem_url, disponivel, ordem, categoria_id, categorias(nome)')
    .order('ordem')
    .order('nome');
  if (error) { console.error(error); toast('Erro ao carregar produtos.', 'erro'); return; }
  produtosCache = data || [];
  renderTabelaProdutos();
}

function renderTabelaProdutos() {
  const tbody = document.getElementById('tbodyProdutos');
  if (!tbody) return;

  const busca = (document.getElementById('buscaProdutos')?.value || '').toLowerCase();
  const filtroCat = document.getElementById('filtroCategoria')?.value || '';

  let lista = produtosCache;
  if (busca) lista = lista.filter(p => p.nome.toLowerCase().includes(busca));
  if (filtroCat) lista = lista.filter(p => String(p.categoria_id) === String(filtroCat));

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="tabela-vazia">Nenhum produto encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(p => `
    <tr>
      <td><img src="${p.imagem_url || 'images/placeholder.jpg'}" alt="${escapeHtml(p.nome)}" /></td>
      <td>${escapeHtml(p.nome)}</td>
      <td>${escapeHtml(p.categorias?.nome || '—')}</td>
      <td>${formatarPreco(p.preco)}</td>
      <td>
        <span class="status-badge ${p.disponivel ? 'status-ok' : 'status-off'}">
          ${p.disponivel ? 'Disponível' : 'Indisponível'}
        </span>
      </td>
      <td>
        <div class="acoes">
          <button class="btn-acao btn-editar" data-editar="${p.id}">Editar</button>
          <button class="btn-acao btn-toggle" data-toggle="${p.id}">${p.disponivel ? 'Desativar' : 'Ativar'}</button>
          <button class="btn-acao btn-excluir" data-excluir="${p.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-editar]').forEach(b =>
    b.addEventListener('click', () => abrirModalEditar(b.dataset.editar)));
  tbody.querySelectorAll('[data-toggle]').forEach(b =>
    b.addEventListener('click', () => toggleDisponibilidade(b.dataset.toggle)));
  tbody.querySelectorAll('[data-excluir]').forEach(b =>
    b.addEventListener('click', () => excluirProduto(b.dataset.excluir)));
}

function configurarFiltros() {
  document.getElementById('buscaProdutos')?.addEventListener('input', renderTabelaProdutos);
  document.getElementById('filtroCategoria')?.addEventListener('change', renderTabelaProdutos);
}

// ============================================================
// MODAL
// ============================================================
function configurarModal() {
  const modal = document.getElementById('modalBackdrop');
  document.getElementById('btnNovoProduto')?.addEventListener('click', abrirModalNovo);
  document.getElementById('modalClose')?.addEventListener('click', fecharModal);
  document.getElementById('btnCancelarProduto')?.addEventListener('click', fecharModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });

  document.getElementById('prodImagem')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = document.getElementById('previewImg');
    img.src = URL.createObjectURL(file);
    img.hidden = false;
  });
}

function abrirModalNovo() {
  const form = document.getElementById('formProduto');
  form.reset();
  document.getElementById('produtoId').value = '';
  document.getElementById('modalTitulo').textContent = 'Novo produto';
  document.getElementById('previewImg').hidden = true;
  document.getElementById('prodDisponivel').checked = true;
  document.getElementById('prodOrdem').value = 0;
  document.getElementById('modalBackdrop').hidden = false;
}

function abrirModalEditar(id) {
  const p = produtosCache.find(x => String(x.id) === String(id));
  if (!p) return;

  document.getElementById('produtoId').value = p.id;
  document.getElementById('prodNome').value = p.nome || '';
  document.getElementById('prodDescricao').value = p.descricao || '';
  document.getElementById('prodPreco').value = p.preco || 0;
  document.getElementById('prodCategoria').value = p.categoria_id || '';
  document.getElementById('prodOrdem').value = p.ordem || 0;
  document.getElementById('prodDisponivel').checked = !!p.disponivel;
  document.getElementById('modalTitulo').textContent = 'Editar produto';

  const img = document.getElementById('previewImg');
  if (p.imagem_url) {
    img.src = p.imagem_url;
    img.hidden = false;
  } else {
    img.hidden = true;
  }
  document.getElementById('prodImagem').value = '';
  document.getElementById('modalBackdrop').hidden = false;
}

function fecharModal() {
  const m = document.getElementById('modalBackdrop');
  if (m) m.hidden = true;
}

// ============================================================
// SALVAR PRODUTO (criar/editar)
// ============================================================
function configurarFormProduto() {
  const form = document.getElementById('formProduto');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarProduto');
    btn.disabled = true;
    btn.textContent = 'Salvando…';

    try {
      const id = document.getElementById('produtoId').value;
      const nome = document.getElementById('prodNome').value.trim();
      const descricao = document.getElementById('prodDescricao').value.trim();
      const preco = parseFloat(document.getElementById('prodPreco').value) || 0;
      const categoria_id = document.getElementById('prodCategoria').value;
      const ordem = parseInt(document.getElementById('prodOrdem').value) || 0;
      const disponivel = document.getElementById('prodDisponivel').checked;
      const file = document.getElementById('prodImagem').files[0];

      let imagem_url = id
        ? (produtosCache.find(p => String(p.id) === String(id))?.imagem_url || '')
        : '';

      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast('Imagem muito grande (máx. 5 MB).', 'erro');
          btn.disabled = false; btn.textContent = 'Salvar';
          return;
        }
        const ext = file.name.split('.').pop().toLowerCase();
        const nomeArquivo = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await db.storage
          .from('produtos')
          .upload(nomeArquivo, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;

        const { data: pub } = db.storage.from('produtos').getPublicUrl(nomeArquivo);
        imagem_url = pub.publicUrl;
      }

      const payload = {
        nome, descricao, preco, categoria_id, ordem, disponivel, imagem_url,
        atualizado_em: new Date().toISOString()
      };

      if (id) {
        const { error } = await db.from('produtos').update(payload).eq('id', id);
        if (error) throw error;
        toast('Produto atualizado!', 'sucesso');
      } else {
        const { error } = await db.from('produtos').insert(payload);
        if (error) throw error;
        toast('Produto criado!', 'sucesso');
      }

      fecharModal();
      await carregarProdutosAdmin();
    } catch (err) {
      console.error(err);
      toast('Erro ao salvar: ' + (err.message || 'verifique o console'), 'erro');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  });
}

// ============================================================
// TOGGLE DISPONIBILIDADE
// ============================================================
async function toggleDisponibilidade(id) {
  const p = produtosCache.find(x => String(x.id) === String(id));
  if (!p) return;
  const { error } = await db
    .from('produtos')
    .update({ disponivel: !p.disponivel })
    .eq('id', id);
  if (error) { toast('Erro ao atualizar.', 'erro'); return; }
  await carregarProdutosAdmin();
  toast('Status atualizado.', 'sucesso');
}

// ============================================================
// EXCLUIR PRODUTO
// ============================================================
async function excluirProduto(id) {
  const p = produtosCache.find(x => String(x.id) === String(id));
  if (!confirm(`Excluir "${p?.nome}"? Esta ação não pode ser desfeita.`)) return;

  const { error } = await db.from('produtos').delete().eq('id', id);
  if (error) { toast('Erro ao excluir.', 'erro'); return; }
  await carregarProdutosAdmin();
  toast('Produto excluído.', 'sucesso');
}

// ============================================================
// CONFIGURAÇÕES (WhatsApp, iFood)
// ============================================================
async function carregarConfigAdmin() {
  const { data, error } = await db.from('configuracoes').select('chave, valor');
  if (error) { console.error(error); return; }
  const cfg = {};
  (data || []).forEach(r => { cfg[r.chave] = r.valor; });
  const w = document.getElementById('cfgWhatsapp');
  const i = document.getElementById('cfgIfood');
  if (w) w.value = cfg.whatsapp || '';
  if (i) i.value = cfg.ifood_url || '';
}

function configurarFormConfig() {
  const form = document.getElementById('formConfig');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const whatsapp = document.getElementById('cfgWhatsapp').value.replace(/\D/g, '');
    const ifood = document.getElementById('cfgIfood').value.trim();

    if (whatsapp.length < 12) {
      toast('WhatsApp inválido. Use DDI+DDD+número (ex.: 5579981515981).', 'erro');
      return;
    }

    const upserts = [
      { chave: 'whatsapp', valor: whatsapp, atualizado_em: new Date().toISOString() },
      { chave: 'ifood_url', valor: ifood, atualizado_em: new Date().toISOString() }
    ];

    const { error } = await db
      .from('configuracoes')
      .upsert(upserts, { onConflict: 'chave' });

    if (error) { toast('Erro ao salvar.', 'erro'); console.error(error); return; }
    toast('Configurações salvas!', 'sucesso');
  });
}

// ============================================================
// CATEGORIAS
// ============================================================
function configurarFormCategoria() {
  const form = document.getElementById('formCategoria');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('novaCategoria');
    const nome = input.value.trim();
    if (!nome) return;

    const ordem = (categoriasCache[categoriasCache.length - 1]?.ordem || 0) + 1;
    const { error } = await db.from('categorias').insert({ nome, ordem });
    if (error) { toast('Erro ao criar categoria.', 'erro'); console.error(error); return; }
    input.value = '';
    await carregarCategoriasAdmin();
    toast('Categoria adicionada.', 'sucesso');
  });
}

async function excluirCategoria(id) {
  const usada = produtosCache.some(p => String(p.categoria_id) === String(id));
  if (usada) {
    toast('Não é possível excluir: há produtos usando esta categoria.', 'erro');
    return;
  }
  if (!confirm('Excluir esta categoria?')) return;

  const { error } = await db.from('categorias').delete().eq('id', id);
  if (error) { toast('Erro ao excluir categoria.', 'erro'); return; }
  await carregarCategoriasAdmin();
  toast('Categoria excluída.', 'sucesso');
}