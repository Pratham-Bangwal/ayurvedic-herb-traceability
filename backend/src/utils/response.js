function success(res, data, status = 200) {
  res.status(status).json({ data });
}

function error(res, code, message, status = 400) {
  res.status(status).json({ 
    error: { 
      code, 
      message 
    } 
  });
}

module.exports = { success, error };
