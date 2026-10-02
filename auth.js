document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const submitLoginBtn = document.getElementById('submitLoginBtn');
  const submitSignUpBtn = document.getElementById('submitSignUpBtn');
  const authNotice = document.getElementById('authNotice');

  function showNotice(message, isError = true) {
    authNotice.style.display = 'block';
    authNotice.className = `auth-notice ${isError ? 'error' : 'success'}`;
    authNotice.textContent = message;
  }

  // สมัครสมาชิกใหม่
  submitSignUpBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showNotice('กรุณากรอกทั้งอีเมลและรหัสผ่าน');
      return;
    }
    if (password.length < 6) {
      showNotice('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    submitSignUpBtn.disabled = true;
    submitSignUpBtn.textContent = 'กำลังลงทะเบียน...';

    const { data, error } = await supabaseClient.auth.signUp({ email, password });

    submitSignUpBtn.disabled = false;
    submitSignUpBtn.textContent = 'สมัครสมาชิกใหม่';

    if (error) {
      showNotice('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      showNotice('สมัครสมาชิกเรียบร้อยแล้ว กำลังนำท่านเข้าสู่ระบบ...', false);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
    }
  });

  // เข้าสู่ระบบ
  submitLoginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showNotice('กรุณากรอกทั้งอีเมลและรหัสผ่าน');
      return;
    }

    submitLoginBtn.disabled = true;
    submitLoginBtn.textContent = 'กำลังตรวจสอบ...';

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    submitLoginBtn.disabled = false;
    submitLoginBtn.textContent = 'เข้าสู่ระบบ';

    if (error) {
      showNotice('อีเมลหรือรหัสผ่านไม่ถูกต้อง: ' + error.message);
    } else {
      showNotice('เข้าสู่ระบบสำเร็จ! กำลังกลับสู่หน้าหลัก...', false);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    }
  });
});