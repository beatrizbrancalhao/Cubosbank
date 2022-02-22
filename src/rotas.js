const express = require('express');
const { banco, contas, saques, depositos, transferencias } = require('./bancodedados');
const { listarConta, criarConta, atualizarConta, deletarConta, depositarDinheiro, sacarDinheiro, transferirDinheiro, mostrarExtrato, mostrarSaldo } = require('./controladores/contas')
const rotas = express();

rotas.get('/contas', listarConta)
rotas.post('/contas', criarConta)
rotas.put('/contas/:numeroConta/usuario', atualizarConta)
rotas.delete('/contas/:numeroConta', deletarConta)
rotas.post('/transacoes/depositar', depositarDinheiro)
rotas.post('/transacoes/sacar', sacarDinheiro)
rotas.post('/transacoes/transferir', transferirDinheiro)
rotas.get('/transacoes/saldo', mostrarSaldo)
rotas.get('/transacoes/extrato', mostrarExtrato)

module.exports = rotas;