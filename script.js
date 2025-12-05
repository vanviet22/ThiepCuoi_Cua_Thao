document.addEventListener('DOMContentLoaded', () => {
    
    // --- KHAI BÁO BIẾN ---
    const introCurtain = document.getElementById('intro-curtain');
    let audio = document.getElementById('bg-music');
    const btn = document.getElementById('music-toggle');
    let icon = document.getElementById('music-icon');
    let isPlaying = false; 

    // --- 1. CẤU HÌNH ICON & MUSIC PLAYER ---
    
    // Fallback nếu không tìm thấy icon img
    if (!icon) {
        icon = btn; 
        if(btn) btn.textContent = '🎶'; 
    }

    function updateIcon() {
        if (icon.tagName === 'IMG') {
            // Icon chỉ quay/sáng khi nhạc thực sự đang phát và không bị pause
            const newState = (isPlaying && !audio.paused) ? ICON_ON : ICON_OFF;
            if (icon.src !== newState) {
                const newImg = icon.cloneNode(true);
                newImg.src = newState;
                icon.parentNode.replaceChild(newImg, icon);
                icon = newImg;
            }
        } else {
             icon.textContent = (isPlaying && !audio.paused) ? '🎶' : '🎵';
        }
    }

    // Hàm phát nhạc an toàn (Unmuted)
    function safePlay() {
        if (!audio) return Promise.reject("No audio");
        audio.muted = false;
        audio.volume = 1;
        return audio.play();
    }
    
    // Hàm kích hoạt nhạc (Unmute) khi có tương tác đầu tiên của người dùng
    const activateMusicOnInteraction = () => {
        // Chỉ kích hoạt nếu nhạc đang bị mute hoặc đang pause
        if (audio && (audio.muted || audio.paused)) {
            safePlay().then(() => {
                isPlaying = true;
            }).catch(e => {
                // Nếu trình duyệt vẫn chặn, giữ nguyên trạng thái cũ
                console.log("Auto-play blocked:", e);
            });
            updateIcon();
        }
        // Loại bỏ listener để không chạy lại nhiều lần
        document.body.removeEventListener('click', activateMusicOnInteraction);
        document.body.removeEventListener('touchend', activateMusicOnInteraction);
    };

    // Xử lý nút bật/tắt nhạc ở góc màn hình
    if (btn && audio) {
        updateIcon(); 
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Ngăn sự kiện lan ra body
            if (isPlaying && !audio.paused) {
                audio.pause();
                isPlaying = false;
            } else {
                safePlay().then(() => {
                    isPlaying = true;
                }).catch(e => {
                    // Fallback: Phát muted nếu không được phép unmuted
                    audio.muted = true;
                    audio.play().then(() => isPlaying = true);
                });
            }
            updateIcon();
        });
    }

    // --- 2. INTRO SCREEN LOGIC (TỰ ĐỘNG & HIỆU ỨNG TRÁI TIM) ---
    if (introCurtain) {
        // A. Cố gắng phát nhạc (Muted) ngay lập tức khi load trang
        if (audio) {
            audio.muted = true;
            audio.play().then(() => {
                // Nhạc nền chạy ngầm (không tiếng)
            }).catch(e => {});
        }
        
        // B. Tự động mở màn rèm ngay lập tức (0ms delay)
        setTimeout(() => {
            introCurtain.classList.add('opened');
            
            // Kích hoạt lại layout để đảm bảo CSS animation (trái tim) chạy
            void introCurtain.offsetHeight;
            
            // C. Đợi 6 GIÂY cho hiệu ứng trái tim bay hết, rồi mới ẩn Intro
            setTimeout(() => {
                introCurtain.style.opacity = '0'; // Hiệu ứng mờ dần
                
                // Sau khi mờ dần xong (0.5s), ẩn hẳn khỏi màn hình
                setTimeout(() => {
                    introCurtain.style.display = 'none';
                    introCurtain.style.pointerEvents = 'none'; 
                    
                    // D. Gắn sự kiện: Chạm vào bất kỳ đâu để BẬT TIẾNG nhạc
                    if (audio) {
                        document.body.addEventListener('click', activateMusicOnInteraction, { once: true });
                        document.body.addEventListener('touchend', activateMusicOnInteraction, { once: true });
                    }
                }, 500); 
            }, 6000); // 6000ms = 6 giây

        }, 0); 
    }

    // --- 3. SCROLL ANIMATION & LAZY LOAD ---
    const scrollAnimatedElements = document.querySelectorAll('.animate-fade-in-up, .photo-item');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px 100px 0px', // Kích hoạt sớm hơn một chút trước khi vào khung hình
        threshold: 0.01 
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                target.classList.add('is-visible');

                // Lazy load cho ảnh trong Album
                if (target.classList.contains('photo-item')) {
                    const img = target.querySelector('.lazy-photo');
                    if (img && img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                }
                observer.unobserve(target);
            }
        });
    }, observerOptions);

    scrollAnimatedElements.forEach(el => scrollObserver.observe(el));

    // --- 4. POPUP & FORM LOGIC ---
    const bankPopup = document.getElementById('bank-popup');
    const openBankButton = document.getElementById('open-bank-popup');
    const closeButtons = document.querySelectorAll('.close-button');
    const rsvpForm = document.getElementById('rsvp-form');
    const thankYouPopup = document.getElementById('thank-you-popup');

    function togglePopup(popupElement, show) {
        if(!popupElement) return;
        if(show) {
            popupElement.classList.add('show');
            popupElement.classList.remove('hidden');
        } else {
            popupElement.classList.remove('show');
            popupElement.classList.add('hidden');
        }
    }

    if (openBankButton) {
        openBankButton.addEventListener('click', () => togglePopup(bankPopup, true));
    }

    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            togglePopup(e.target.closest('.popup'), false);
        });
    });

    // Đóng popup khi click ra ngoài vùng nội dung
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup')) {
            togglePopup(e.target, false);
        }
    });

    // Xử lý Form RSVP (Giả lập)
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            togglePopup(thankYouPopup, true); 
            rsvpForm.reset(); 
        });
    }
    // --- 5. TÍNH SỐ NGÀY YÊU THƯƠNG ---
    const startDate = new Date(2018, 7, 1); 

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function updateLoveDays() {
        const countElement = document.getElementById('total-days');
        if (countElement) {
            const now = new Date();
            const diff = now - startDate;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            // Gọi hàm chạy hiệu ứng số từ 0 đến kết quả trong 2500ms (2.5 giây)
            animateValue(countElement, 0, days, 3000); 
        }
    }
    
    // Gọi hàm chạy ngay lập tức khi web tải xong
    updateLoveDays();
});