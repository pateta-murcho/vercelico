import axios from "axios";

// =============================
// CONFIGURAÇÃO MAGAZORD
// =============================
const BASE_URL = "https://danajalecos.painel.magazord.com.br/api/v2/site";
const USER = "MZDKe610ed8d77404c8ebe37b79a35b579a5e4e85682c15d6bd89f30d5852757";
const PASS = "o#W51myRIS@j";

const auth = {
  auth: {
    username: USER,
    password: PASS
  }
};

// =============================
// CONFIG GHL
// =============================
const GHL_WEBHOOK =
  "https://services.leadconnectorhq.com/hooks/scD4yzuj3zsDsqfrgvtZ/webhook-trigger/b6fd6bb0-15ef-4af5-af2b-3122b92376b6";

// =============================
// CONSULTA CARRINHOS
// =============================
async function getCarrinhos() {
  const res = await axios.get(`${BASE_URL}/carrinho`, {
    ...auth,
    params: {
      limit: 50,
      page: 1,
      order: "id",
      orderDirection: "desc",
      status: "1,2,3"
    }
  });
  return res.data?.data?.items || [];
}

// =============================
// CONSULTA PEDIDOS
// =============================
async function getPedidos() {
  const res = await axios.get(`${BASE_URL}/pedido`, {
    ...auth,
    params: {
      limit: 50,
      page: 1,
      orderDirection: "desc"
    }
  });
  return res.data?.data?.items || [];
}

// =============================
// CONSULTA PEDIDO PELO CÓDIGO
// =============================
async function getPedidoCodigo(codigo) {
  try {
    const res = await axios.get(`${BASE_URL}/pedido/${codigo}`, {
      ...auth,
      params: { listaContatos: 1 }
    });
    return res.data?.data || null;
  } catch {
    return null;
  }
}

// =============================
// CONSULTA PESSOA
// =============================
async function getPessoa(id) {
  try {
    const res = await axios.get(`${BASE_URL}/pessoa/${id}`, auth);
    return res.data || null;
  } catch {
    return null;
  }
}

// =============================
// MONTA JSON FINAL
// =============================
async function montarEstrutura() {
  const carrinhos = await getCarrinhos();
  const pedidos = await getPedidos();
  const final = [];

  for (const ped of pedidos) {
    const pedidoCompleto = await getPedidoCodigo(ped.codigo);
    const pessoa = await getPessoa(ped.pessoaId);

    final.push({
      pedidoId: ped.id,
      codigo: ped.codigo,
      valorTotal: ped.valorTotal,
      status: ped.pedidoSituacaoDescricao,
      data: ped.dataHora,
      carrinhosRelacionados: carrinhos.filter(
        c => c.pedido?.codigo === ped.codigo
      ),

      itens: pedidoCompleto?.arrayPedidoRastreio?.[0]?.pedidoItem || [],

      cliente: {
        nome: pessoa?.nome || "",
        email: pessoa?.email || "",
        telefones: pessoa?.pessoaContato?.map(t => t.contato) || []
      }
    });
  }

  return final;
}

// =============================
// ENVIA PARA O GHL
// =============================
async function enviarParaGHL(payload) {
  await axios.post(GHL_WEBHOOK, payload);
}

// =============================
// HANDLER SERVERLESS (VERCEL)
// =============================
export default async function handler(req, res) {
  try {
    const dados = await montarEstrutura();
    await enviarParaGHL({ pedidos: dados });

    res.status(200).json({
      status: "ok",
      enviado_para_GHL: true,
      total_registros: dados.length
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      mensagem: err?.response?.data || err.toString()
    });
  }
}
