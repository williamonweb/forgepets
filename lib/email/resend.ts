type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendPasswordResetEmail({ to, resetUrl }: SendPasswordResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Forge Pets <nao-responda@forgepets.com.br>';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY não configurada.');
  }

  const safeUrl = escapeHtml(resetUrl);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Redefinição de senha — Forge Pets',
      html: `
        <div style="background:#f5f3ff;padding:32px;font-family:Arial,sans-serif;color:#24163d">
          <div style="max-width:560px;margin:auto;background:white;border-radius:18px;padding:32px;border:1px solid #e6ddff">
            <div style="font-size:13px;font-weight:700;letter-spacing:.08em;color:#6d28d9">FORGE PETS</div>
            <h1 style="font-size:24px;margin:12px 0">Redefinição de senha</h1>
            <p style="line-height:1.6;color:#5f5870">Recebemos uma solicitação para alterar a senha da sua conta.</p>
            <p style="line-height:1.6;color:#5f5870">O link abaixo é válido por 1 hora:</p>
            <p style="margin:28px 0">
              <a href="${safeUrl}" style="display:inline-block;background:#6d28d9;color:white;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700">
                Criar nova senha
              </a>
            </p>
            <p style="font-size:13px;line-height:1.6;color:#777084">Caso você não tenha solicitado a redefinição, ignore este e-mail.</p>
          </div>
        </div>
      `,
      text: `Redefinição de senha Forge Pets\n\nAcesse o link abaixo em até 1 hora:\n${resetUrl}\n\nCaso não tenha solicitado, ignore este e-mail.`
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Falha ao enviar e-mail pelo Resend (${response.status}): ${details}`);
  }

  return response.json();
}
