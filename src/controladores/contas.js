const app = require('../servidor');
const bancoDeDados = require('../bancodedados');
const { contas, saques, depositos, transferencias } = require('../bancodedados');
const { format } = require('date-fns');
const { reach } = require('yup');

function listarConta (req, res) {

    console.log('Requisitando todas as contas')

    if (req.query.senha !== "Cubos123Bank") {
        console.log('Acesso negado: digitou a senha incorreta');
        res.status(401);
        res.json('senha incorreta');
        return;
    }
    console.log('Acesso permitido');
    res.status(200);
    res.send(contas);
}

let proximoNumero = 1;

function criarConta (req, res) {

    console.log('Criando uma nova conta:', req.body)

    if (!req.body.nome || !req.body.cpf || !req.body.data_nascimento || !req.body.telefone || !req.body.email || !req.body.senha) {
        res.status(400);
        res.json({mensagem:'Os campos nome, cpf, data_nascimento, telefone, email e senha são obrigatórios.'});
        return;
    }

    if (typeof req.body.nome !== "string" || typeof req.body.cpf !== "string" || typeof req.body.telefone !== "string" || typeof req.body.email !== "string" || typeof req.body.senha !== "string") {
        res.status(400);
        res.json({mensagem:'Os campos nome, cpf, data_nascimento, telefone, email e senha devem ser preenchidos com um texto.'})
        return;
    }

    const verificarCPF = contas.find(x => x.usuario.cpf === req.body.cpf)
    const verificarEmail = contas.find(x => x.usuario.email === req.body.email)

    if (verificarCPF || verificarEmail) {
        res.status(400);
        res.json({mensagem: 'Os campos cpf e email devem ser únicos.'});
        return;
    }



    const novaConta = {
        numero: proximoNumero,
        saldo: 0,
        usuario: {
            nome: req.body.nome,
            cpf: req.body.cpf,
            data_nascimento: req.body.data_nascimento,
            telefone: req.body.telefone,
            email: req.body.email,
            senha: req.body.senha
    }
}

    contas.push(novaConta);

    proximoNumero += 1;

    res.status(201);
    res.json(novaConta);
}

function atualizarConta (req, res) {

    const editarConta = contas.find(x => {
       
        const verificarCPF = contas.find(x => x.usuario.cpf === req.body.cpf)
        const verificarEmail = contas.find(x => x.usuario.email === req.body.email)
    
        if (verificarCPF || verificarEmail) {
            res.status(400);
            res.json({mensagem: 'Os campos cpf e email devem ser únicos.'});
            return;

        } else if (x.numero === Number(req.params.numeroConta)) {

            x.usuario = {
                nome: req.body.nome || x.usuario.nome,
                cpf: req.body.cpf || x.usuario.cpf,
                data_nascimento: req.body.data_nascimento || x.usuario.data_nascimento,
                telefone: req.body.telefone || x.usuario.telefone,
                email: req.body.email || x.usuario.email,
                senha: req.body.senha || x.usuario.senha
             }

        return res.json({mensagem:'Conta atualizada com sucesso!'})

        } else {
            res.status(404)
            res.json({mensagem: "Conta não encontrada"})
         }
    })
}

function deletarConta (req, res) {
     const contaDeletada = contas.find(contaDeletada => contaDeletada.numero === Number(req.params.numeroConta))
     const indice = contas.indexOf(contaDeletada)
     
     if (!contaDeletada) {
        res.status(404);
        res.json({mensagem: "A conta informada não existe!"})
    } 

    if (contaDeletada.saldo !== 0) {
         res.json({mensagem: "Retire todo o saldo antes de deletar a conta!"})
         return;
     }
     contas.splice(indice, 1)

     res.json({mensagem: "Conta excluída com sucesso!"})
     console.log('Deletando conta')
  
}

function depositarDinheiro (req, res) {

    console.log('Solicitando depósito')

    if (!req.body.numeroConta || !req.body.valor) {
        res.status(400);
        res.json({mensagem: "O número da conta e o valor são obrigatórios!"})
        return;
    }

    const contaDeposito = contas.find(contaDeposito => contaDeposito.numero === Number(req.body.numeroConta))

    if(!contaDeposito) {
        res.status(404);
        res.json({mensagem: "A conta informada não existe!"})
        return;
    }

    if(req.body.valor <= 0) {
        res.status(400)
        res.json({mensagem: "Não é permitido depositar valores negativos ou zerados."})
        return;
    }

    contaDeposito.saldo += req.body.valor
    res.json({mensagem: "Depósito realizado com sucesso!"})

    const date = new Date()
    const depositoRealizado = {
        data: format(date, "yyyy-MM-dd'T'HH-mm-ss"),
        numero_conta: req.body.numeroConta,
        valor: req.body.valor
    }

    depositos.push(depositoRealizado);

}

function sacarDinheiro (req, res) {

    console.log('Solicitando saque')

    if (!req.body.numeroConta || !req.body.valor || !req.body.senha) {
        res.status(400);
        res.json({mensagem: "O número da conta, o valor e a senha são obrigatórios!"})
        return;
    }

    const contaSaque = contas.find(contaSaque => contaSaque.numero === Number(req.body.numeroConta))

    if(!contaSaque) {
        res.status(404);
        res.json({mensagem: "A conta informada não existe!"})
        return;
    }

    if(req.body.senha !== contaSaque.usuario.senha) {
        res.status(400)
        res.json({mensagem: "Senha inválida"})
        return;
    }

    if(req.body.valor > contaSaque.saldo) {
        res.status(400)
        res.json({mensagem: "O valor do saque é maior que o saldo da conta."})
        return;
    }

    contaSaque.saldo -= req.body.valor
    res.json({mensagem: "Saque realizado com sucesso!"})

    const date = new Date()
    const saqueRealizado = {
        data: format(date, "yyyy-MM-dd'T'HH-mm-ss"),
        numero_conta: req.body.numeroConta,
        valor: req.body.valor
    }

    saques.push(saqueRealizado);
}

function transferirDinheiro (req, res) {

    console.log('Solicitando transferência')

    if (!req.body.numero_conta_origem || !req.body.numero_conta_destino || !req.body.valor || !req.body.senha) {
        res.status(400);
        res.json({mensagem: "O número da conta de origem, o númeuro da conta de destino, o valor e a senha são obrigatórios!"})
        return;
    }

    const contaOrigem = contas.find(contaOrigem => contaOrigem.numero === Number(req.body.numero_conta_origem))

    if(!contaOrigem) {
        res.status(404);
        res.json({mensagem: "A conta de origem informada não existe!"})
        return;
    }

    const contaDestino = contas.find(contaDestino => contaDestino.numero === Number(req.body.numero_conta_destino))

    if(!contaDestino) {
        res.status(404);
        res.json({mensagem: "A conta  de destino informada não existe!"})
        return;
    }

    if(req.body.senha !== contaOrigem.usuario.senha) {
        res.status(400)
        res.json({mensagem: "Senha inválida"})
        return;
    }

    if(req.body.valor > contaOrigem.saldo) {
        res.status(400)
        res.json({mensagem: "O valor da transferência é maior que o saldo da conta de origem."})
        return;
    }

    contaOrigem.saldo -= req.body.valor;

    contaDestino.saldo += req.body.valor;

    transferencias.push({
        data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        numero_conta_origem: req.body.numero_conta_origem,
        numero_conta_destino: req.body.numero_conta_destino,
        valor: req.body.valor })
        
    res.json({ mensagem: "Transferência realizada com sucesso!" })
 }

 function mostrarExtrato (req, res) {
    console.log('Solicitando acesso ao extrato')

    if (!req.query.numero_conta || !req.query.senha) {
        res.status(400)
        res.json({mensagem: "O número da conta e a senha são obrigatórios!"})
        return;
    }

    const contaExtrato = contas.find(contaExtrato => contaExtrato.numero === Number(req.query.numero_conta))

     if(!contaExtrato) {
         res.status(404);
         res.json({mensagem: "A conta informada não existe!"})
         return;
    }

    if(req.query.senha !== contaExtrato.usuario.senha) {
        res.status(400)
        res.json({mensagem: "Senha inválida"})
        return;
    }

    const saquesConta = bancoDeDados.saques.filter(x => x.numero_conta == req.query.numero_conta);
    const depositoConta = bancoDeDados.depositos.filter(x => x.numero_conta === Number(req.query.numero_conta));
    const transferenciasEnviadas = bancoDeDados.transferencias.filter(x => x.numero_conta_origem === Number(req.query.numero_conta));
    const transferenciasRecebidas = bancoDeDados.transferencias.filter(x => x.numero_conta_destino === Number(req.query.numero_conta));
    console.log(bancoDeDados.saques)
    res.status(200)
     res.json({saquesConta, depositoConta, transferenciasEnviadas, transferenciasRecebidas})

}

function mostrarSaldo (req, res) {

    console.log('Solicitando acesso ao saldo')

    if (!req.query.numero_conta || !req.query.senha) {
        res.status(400)
        res.json({mensagem: "O número da conta e a senha são obrigatórios!"})
        return;
    }

    const contaSaldo = contas.find(contaSaldo => contaSaldo.numero === Number(req.query.numero_conta))

     if(!contaSaldo) {
         res.status(404);
         res.json({mensagem: "A conta informada não existe!"})
         return;
    }

    if(req.query.senha !== contaSaldo.usuario.senha) {
        res.status(400)
        res.json({mensagem: "Senha inválida"})
        return;
    }

    res.status(200)
    res.json({saldo: contaSaldo.saldo})
}



module.exports = { listarConta, criarConta, atualizarConta, deletarConta, depositarDinheiro, sacarDinheiro, transferirDinheiro, mostrarExtrato, mostrarSaldo }