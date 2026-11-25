const express = require('express');

/**
 * Router com handlers assíncronos protegidos.
 * No Express 4 uma rejeição dentro de um handler async não é capturada e
 * derruba o processo. Aqui todo handler é embrulhado e o erro segue para o
 * middleware de erro, mantendo a API no ar.
 */
function safeRouter() {
  const router = express.Router();
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const original = router[method].bind(router);
    router[method] = (path, ...handlers) =>
      original(
        path,
        ...handlers.map((handler) =>
          typeof handler === 'function' && handler.length < 4
            ? (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
            : handler
        )
      );
  }
  return router;
}

module.exports = safeRouter;
