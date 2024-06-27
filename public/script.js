document.addEventListener('DOMContentLoaded', () => {
  const transactionForm = document.getElementById('transactionForm');

  transactionForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const toAddress = document.getElementById('toAddress').value.trim();
    const turnstileResponse = document.querySelector('.cf-turnstile [name="cf-turnstile-response"]').value;

    try {
      const response = await fetch('/send-sol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toAddress, 'cf-turnstile-response': turnstileResponse }),
      });

      const data = await response.json();

      if (data.success) {
        const transactionLink = `https://explorer.sonic.game/tx/${data.signature}`;
        Swal.fire({
          icon: 'success',
          title: 'Transaction Successful',
          html: `Transaction sent successfully. <br>View transaction <a href="${transactionLink}" target="_blank">here</a>.`,
        });
        transactionForm.reset();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Transaction Failed',
          text: `Failed to send transaction: ${data.error}`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error sending transaction: ${error.message}`,
      });
    }
  });
});
