const gerarQRCode = async (refeicaoId) => {
  const res = await fetch(`http://localhost:4000/refeicao/${refeicaoId}/qrcode`, { method: "POST" });
  const data = await res.json();
  setQrData(data.qrData);
};
