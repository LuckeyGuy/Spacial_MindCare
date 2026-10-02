document.addEventListener('DOMContentLoaded', async () => {
  // 1. Mobile Menu
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  // 2. FAQ Accordion
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    const body = item.querySelector('.accordion-body');

    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      accordionItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        const otherBody = otherItem.querySelector('.accordion-body');
        if (otherBody) otherBody.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // 3. ตรวจสอบสถานะ User จาก Supabase & จัดการปุ่มเมนู
  async function refreshUserStatus() {
    if (!window.supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    const userNavBox = document.getElementById('userNavBox');
    const navHistoryLink = document.getElementById('navHistoryLink');

    if (session && session.user) {
      const user = session.user;

      if (navHistoryLink) {
        navHistoryLink.style.display = 'inline-block';
      }

      if (userNavBox) {
        userNavBox.innerHTML = `
          <span class="user-pill-badge" title="${user.email}">👤 ${user.email}</span>
          <button id="logoutBtn" class="btn btn-outline btn-sm">ออกจากระบบ</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', async () => {
          await supabaseClient.auth.signOut();
          window.location.reload();
        });
      }
      return user;
    } else {
      if (navHistoryLink) {
        navHistoryLink.style.display = 'none';
      }

      if (userNavBox) {
        userNavBox.innerHTML = `<a href="auth.html" id="authNavBtn" class="btn btn-outline btn-sm">เข้าสู่ระบบ</a>`;
      }
      return null;
    }
  }

  let currentUser = await refreshUserStatus();

  if (window.supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      currentUser = session ? session.user : null;
      await refreshUserStatus();
    });
  }

  // 4. Daily Mood Tracker
  let selectedMoodScore = null;
  let selectedMoodLabel = null;
  const moodBtns = document.querySelectorAll('.mood-btn');
  const moodNoteInput = document.getElementById('moodNoteInput');
  const saveMoodBtn = document.getElementById('saveMoodBtn');
  const moodStatusText = document.getElementById('moodStatusText');

  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMoodScore = parseInt(btn.getAttribute('data-score'));
      selectedMoodLabel = btn.getAttribute('data-label');
    });
  });

  if (saveMoodBtn) {
    saveMoodBtn.addEventListener('click', async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const activeUser = session ? session.user : null;

      if (!activeUser) {
        moodStatusText.innerHTML = '⚠️ คุณยังไม่ได้เข้าสู่ระบบ กรุณา <a href="auth.html" style="color:var(--primary); font-weight:600; text-decoration:underline;">เข้าสู่ระบบที่นี่</a> ก่อนค่ะ';
        return;
      }

      if (!selectedMoodScore) {
        moodStatusText.textContent = 'กรุณาคลิกเลือกอิโมจิอารมณ์ของคุณก่อนนะคะ';
        return;
      }

      saveMoodBtn.disabled = true;
      saveMoodBtn.textContent = 'กำลังบันทึก...';
      const note = moodNoteInput ? moodNoteInput.value.trim() : '';

      const { error } = await supabaseClient.from('daily_moods').insert([{
        user_id: activeUser.id,
        mood_level: selectedMoodScore,
        mood_label: selectedMoodLabel,
        mood_note: note
      }]);

      saveMoodBtn.disabled = false;
      saveMoodBtn.textContent = 'บันทึกอารมณ์';

      if (!error) {
        moodStatusText.textContent = '✨ บันทึกอารมณ์ของคุณเรียบร้อยแล้วค่ะ!';
        if (moodNoteInput) moodNoteInput.value = '';
      } else {
        moodStatusText.textContent = 'เกิดข้อผิดพลาด: ' + error.message;
      }
    });
  }

  // 5. Bookmark บทความ
  const bookmarkBtns = document.querySelectorAll('.bookmark-btn');
  bookmarkBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const activeUser = session ? session.user : null;

      if (!activeUser) {
        alert('กรุณาเข้าสู่ระบบก่อนบันทึกบทความค่ะ');
        return;
      }
      const key = btn.getAttribute('data-key');
      const title = btn.getAttribute('data-title');

      btn.textContent = '⏳';
      const { error } = await supabaseClient.from('saved_articles').insert([{
        user_id: activeUser.id,
        article_key: key,
        title: title
      }]);

      if (error) {
        alert('บทความนี้ถูกบันทึกไว้แล้วค่ะ');
        btn.textContent = '🔖';
      } else {
        btn.textContent = '✅';
        alert(`บันทึกบทความ "${title}" เรียบร้อยแล้วค่ะ`);
      }
    });
  });

  // 6. Box Breathing Modal
  const breathingModal = document.getElementById('breathingModal');
  const openBreathingFab = document.getElementById('openBreathingFab');
  const closeBreatheBtn = document.getElementById('closeBreatheBtn');
  const breatheCircle = document.getElementById('breatheCircle');
  const breatheText = document.getElementById('breatheText');
  const breatheTimer = document.getElementById('breatheTimer');
  const startBreatheBtn = document.getElementById('startBreatheBtn');
  const stopBreatheBtn = document.getElementById('stopBreatheBtn');

  function openModal(e) {
    if (e) e.preventDefault();
    if (breathingModal) breathingModal.classList.add('show');
  }

  function closeModal() {
    if (breathingModal) breathingModal.classList.remove('show');
    stopBreathing();
  }

  if (openBreathingFab) openBreathingFab.addEventListener('click', openModal);
  if (closeBreatheBtn) closeBreatheBtn.addEventListener('click', closeModal);

  let breatheInterval = null;
  const stages = [
    { text: 'หายใจเข้าลึกๆ...', duration: 4, scale: 'expand' },
    { text: 'กลั้นหายใจไว้...', duration: 4, scale: 'hold' },
    { text: 'ผ่อนลมหายใจออก...', duration: 4, scale: 'shrink' },
    { text: 'พักผ่อนคลาย...', duration: 4, scale: 'hold' }
  ];
  let stageIdx = 0;
  let remaining = 4;

  function runBreathingStep() {
    const cur = stages[stageIdx];
    breatheText.textContent = cur.text;
    breatheTimer.textContent = remaining;

    if (cur.scale === 'expand') breatheCircle.className = 'breathe-circle expand';
    else if (cur.scale === 'shrink') breatheCircle.className = 'breathe-circle shrink';

    remaining--;
    if (remaining < 0) {
      stageIdx = (stageIdx + 1) % stages.length;
      remaining = stages[stageIdx].duration;
    }
  }

  function startBreathing() {
    startBreatheBtn.style.display = 'none';
    stopBreatheBtn.style.display = 'inline-flex';
    stageIdx = 0;
    remaining = 4;
    runBreathingStep();
    breatheInterval = setInterval(runBreathingStep, 1000);
  }

  function stopBreathing() {
    clearInterval(breatheInterval);
    breatheInterval = null;
    if (startBreatheBtn) startBreatheBtn.style.display = 'inline-flex';
    if (stopBreatheBtn) stopBreatheBtn.style.display = 'none';
    if (breatheCircle) breatheCircle.className = 'breathe-circle';
    if (breatheText) breatheText.textContent = 'พร้อม';
    if (breatheTimer) breatheTimer.textContent = '4';
  }

  if (startBreatheBtn) startBreatheBtn.addEventListener('click', startBreathing);
  if (stopBreatheBtn) stopBreatheBtn.addEventListener('click', stopBreathing);

  // ====================================================
  // 7. ฟีเจอร์: Sound Synthesizer (Web Audio API 100% Native)
  // ไม่ต้องโหลดไฟล์นอก ไม่ติด CORS เล่นได้พร้อมกันทุกเสียง
  // ====================================================
  const toggleSoundFab = document.getElementById('toggleSoundFab');
  const soundPanel = document.getElementById('soundPanel');
  const closeSoundPanel = document.getElementById('closeSoundPanel');
  const soundIcon = document.getElementById('soundIcon');
  const timerCountdownText = document.getElementById('timerCountdownText');

  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // สร้าง Noise Buffer ความยาว 5 วินาที
  function createNoiseBuffer(ctx) {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // ตัวจัดการระบบเสียงแต่ละบรรยากาศ
  const soundEngines = {
    rain: {
      isPlaying: false,
      userVolume: 0.7,
      gainNode: null,
      source: null,
      start() {
        const ctx = getAudioContext();
        this.source = ctx.createBufferSource();
        this.source.buffer = createNoiseBuffer(ctx);
        this.source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1100;

        this.gainNode = ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.userVolume * 0.45, ctx.currentTime);

        this.source.connect(filter);
        filter.connect(this.gainNode);
        this.gainNode.connect(ctx.destination);
        this.source.start(0);
        this.isPlaying = true;
      },
      stop() {
        if (this.source) {
          try { this.source.stop(); } catch(e){}
          this.source.disconnect();
          this.source = null;
        }
        this.isPlaying = false;
      },
      setVolume(val) {
        this.userVolume = val;
        if (this.gainNode && audioCtx) {
          this.gainNode.gain.setValueAtTime(val * 0.45, audioCtx.currentTime);
        }
      }
    },

    ocean: {
      isPlaying: false,
      userVolume: 0.7,
      gainNode: null,
      source: null,
      lfo: null,
      start() {
        const ctx = getAudioContext();
        this.source = ctx.createBufferSource();
        this.source.buffer = createNoiseBuffer(ctx);
        this.source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 450;

        this.gainNode = ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.userVolume * 0.5, ctx.currentTime);

        // LFO จำลองคลื่นซัดเข้า-ออกช้าๆ ทุก 7 วินาที
        this.lfo = ctx.createOscillator();
        this.lfo.frequency.value = 0.14; 
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 280;
        this.lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        this.lfo.start(0);

        this.source.connect(filter);
        filter.connect(this.gainNode);
        this.gainNode.connect(ctx.destination);
        this.source.start(0);
        this.isPlaying = true;
      },
      stop() {
        if (this.source) {
          try { this.source.stop(); } catch(e){}
          this.source.disconnect();
          this.source = null;
        }
        if (this.lfo) {
          try { this.lfo.stop(); } catch(e){}
          this.lfo.disconnect();
          this.lfo = null;
        }
        this.isPlaying = false;
      },
      setVolume(val) {
        this.userVolume = val;
        if (this.gainNode && audioCtx) {
          this.gainNode.gain.setValueAtTime(val * 0.5, audioCtx.currentTime);
        }
      }
    },

    forest: {
      isPlaying: false,
      userVolume: 0.7,
      gainNode: null,
      source: null,
      lfo: null,
      start() {
        const ctx = getAudioContext();
        this.source = ctx.createBufferSource();
        this.source.buffer = createNoiseBuffer(ctx);
        this.source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 850;
        filter.Q.value = 2.5;

        this.gainNode = ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.userVolume * 0.35, ctx.currentTime);

        // LFO จำลองลมหวีดหวิวเป็นระลอก
        this.lfo = ctx.createOscillator();
        this.lfo.frequency.value = 0.22;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 400;
        this.lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        this.lfo.start(0);

        this.source.connect(filter);
        filter.connect(this.gainNode);
        this.gainNode.connect(ctx.destination);
        this.source.start(0);
        this.isPlaying = true;
      },
      stop() {
        if (this.source) {
          try { this.source.stop(); } catch(e){}
          this.source.disconnect();
          this.source = null;
        }
        if (this.lfo) {
          try { this.lfo.stop(); } catch(e){}
          this.lfo.disconnect();
          this.lfo = null;
        }
        this.isPlaying = false;
      },
      setVolume(val) {
        this.userVolume = val;
        if (this.gainNode && audioCtx) {
          this.gainNode.gain.setValueAtTime(val * 0.35, audioCtx.currentTime);
        }
      }
    },

    fire: {
      isPlaying: false,
      userVolume: 0.7,
      gainNode: null,
      source: null,
      timerId: null,
      start() {
        const ctx = getAudioContext();
        this.source = ctx.createBufferSource();
        this.source.buffer = createNoiseBuffer(ctx);
        this.source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 220;

        this.gainNode = ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.userVolume * 0.6, ctx.currentTime);

        this.source.connect(filter);
        filter.connect(this.gainNode);
        this.gainNode.connect(ctx.destination);
        this.source.start(0);
        this.isPlaying = true;

        // สุ่มเสียงปะทุเปรี๊ยะๆ ของไม้ฟืน
        const playPop = () => {
          if (!this.isPlaying) return;
          const popOsc = ctx.createOscillator();
          const popGain = ctx.createGain();
          popOsc.frequency.setValueAtTime(150 + Math.random() * 300, ctx.currentTime);
          popGain.gain.setValueAtTime(this.userVolume * 0.15, ctx.currentTime);
          popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
          popOsc.connect(popGain);
          popGain.connect(ctx.destination);
          popOsc.start();
          popOsc.stop(ctx.currentTime + 0.05);

          this.timerId = setTimeout(playPop, 200 + Math.random() * 900);
        };
        playPop();
      },
      stop() {
        if (this.source) {
          try { this.source.stop(); } catch(e){}
          this.source.disconnect();
          this.source = null;
        }
        if (this.timerId) {
          clearTimeout(this.timerId);
          this.timerId = null;
        }
        this.isPlaying = false;
      },
      setVolume(val) {
        this.userVolume = val;
        if (this.gainNode && audioCtx) {
          this.gainNode.gain.setValueAtTime(val * 0.6, audioCtx.currentTime);
        }
      }
    }
  };

  // เปิด-ปิด Panel
  if (toggleSoundFab && soundPanel) {
    toggleSoundFab.addEventListener('click', (e) => {
      e.stopPropagation();
      soundPanel.classList.toggle('show');
    });

    closeSoundPanel.addEventListener('click', () => {
      soundPanel.classList.remove('show');
    });

    document.addEventListener('click', (e) => {
      if (!soundPanel.contains(e.target) && !toggleSoundFab.contains(e.target)) {
        soundPanel.classList.remove('show');
      }
    });
  }

  function checkAnyPlaying() {
    const isAnyPlaying = Object.values(soundEngines).some(engine => engine.isPlaying);
    if (toggleSoundFab) {
      toggleSoundFab.classList.toggle('playing', isAnyPlaying);
      soundIcon.textContent = isAnyPlaying ? '🎵' : '🎧';
    }
  }

  // ควบคุมปุ่มเปิด-ปิด และสไลเดอร์ปรับความดังแต่ละเสียง
  document.querySelectorAll('.sound-track-item').forEach(item => {
    const soundKey = item.getAttribute('data-sound');
    const toggleBtn = item.querySelector('.track-toggle-btn');
    const volumeSlider = item.querySelector('.volume-slider');
    const engine = soundEngines[soundKey];

    if (!engine) return;

    toggleBtn.addEventListener('click', () => {
      if (!engine.isPlaying) {
        engine.start();
        item.classList.add('active');
        toggleBtn.textContent = 'หยุด';
      } else {
        engine.stop();
        item.classList.remove('active');
        toggleBtn.textContent = 'เปิด';
      }
      checkAnyPlaying();
    });

    volumeSlider.addEventListener('input', (e) => {
      engine.setVolume(parseFloat(e.target.value));
    });
  });

  // ระบบตั้งเวลาปิดเสียงอัตโนมัติ (Sleep Timer)
  let sleepTimerInterval = null;
  let remainingSeconds = 0;

  function stopAllSounds() {
    Object.values(soundEngines).forEach(engine => {
      engine.stop();
    });
    document.querySelectorAll('.sound-track-item').forEach(item => {
      item.classList.remove('active');
      const toggleBtn = item.querySelector('.track-toggle-btn');
      if (toggleBtn) toggleBtn.textContent = 'เปิด';
    });
    checkAnyPlaying();
  }

  document.querySelectorAll('.timer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
      const mins = parseInt(btn.getAttribute('data-mins'));

      if (sleepTimerInterval) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
      }

      if (mins === 0) {
        timerCountdownText.textContent = '';
        return;
      }

      btn.classList.add('active');
      remainingSeconds = mins * 60;

      function updateTimerDisplay() {
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        timerCountdownText.textContent = `(เหลือ ${m}:${s < 10 ? '0' : ''}${s})`;

        if (remainingSeconds <= 0) {
          clearInterval(sleepTimerInterval);
          sleepTimerInterval = null;
          timerCountdownText.textContent = '(หมดเวลา - ปิดเสียงแล้ว)';
          document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
          stopAllSounds();
        }
        remainingSeconds--;
      }

      updateTimerDisplay();
      sleepTimerInterval = setInterval(updateTimerDisplay, 1000);
    });
  });
});