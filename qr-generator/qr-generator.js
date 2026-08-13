(function () {
      const elText = document.getElementById('qrText');
      const elSize = document.getElementById('qrSize');
      const elECC  = document.getElementById('qrECC');
      const elFG   = document.getElementById('fgColor');
      const elBG   = document.getElementById('bgColor');

      const btnGenerate = document.getElementById('btnGenerate');
      const btnDownload = document.getElementById('btnDownload');
      const btnClear    = document.getElementById('btnClear');

      const preview = document.getElementById('preview');
      const qrWrap  = document.getElementById('qrcode');
      const meta    = document.getElementById('meta');

      let qrInstance = null;

      function clearQR() {
        qrWrap.innerHTML = '';
        preview.style.display = 'none';
        btnDownload.disabled = true;
        meta.textContent = '';
        qrInstance = null;
      }

      function eccToLevel(ecc) {
        // Map dropdown to library constants
        switch (ecc) {
          case 'L': return QRCode.CorrectLevel.L;
          case 'M': return QRCode.CorrectLevel.M;
          case 'Q': return QRCode.CorrectLevel.Q;
          case 'H': return QRCode.CorrectLevel.H;
          default:  return QRCode.CorrectLevel.M;
        }
      }

      function generate() {
        const text = elText.value.trim();
        if (!text) {
          alert('Please enter some text or a URL.');
          return;
        }

        const size = parseInt(elSize.value, 10) || 300;
        const ecc  = eccToLevel(elECC.value);
        const fg   = elFG.value || '#000000';
        const bg   = elBG.value || '#ffffff';

        // Clear previous QR
        qrWrap.innerHTML = '';

        // Generate new QR
        qrInstance = new QRCode(qrWrap, {
          text: text,
          width: size,
          height: size,
          colorDark: fg,
          colorLight: bg,
          correctLevel: ecc
        });

        // Show preview + enable download
        preview.style.display = 'block';
        btnDownload.disabled = false;

        // Meta info
        meta.textContent = `Content length: ${text.length} • Size: ${size}×${size} • ECC: ${elECC.value}`;
      }

      function downloadPNG() {
        if (!qrInstance) return;

        // qrcodejs may render as <img> or <canvas>; handle both
        const img = qrWrap.querySelector('img');
        const canvas = qrWrap.querySelector('canvas');

        let dataURL;
        if (canvas) {
          dataURL = canvas.toDataURL('image/png');
        } else if (img && img.src) {
          dataURL = img.src;
        } else {
          alert('Unable to find QR image/canvas to download.');
          return;
        }

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `qr-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      // Bind events
      btnGenerate.addEventListener('click', generate);
      btnDownload.addEventListener('click', downloadPNG);
      btnClear.addEventListener('click', clearQR);

      // Optional: live regenerate on option changes if a QR exists
      [elSize, elECC, elFG, elBG].forEach(input => {
        input.addEventListener('change', () => {
          if (qrInstance) generate();
        });
      });

      // Press Enter in the text field to generate
      elText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          generate();
        }
      });
    })();

