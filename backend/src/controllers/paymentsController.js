async function placeholder(req, res) {
  return res.json({ success: true, data: {} });
}

module.exports = {
  placeholder,
};