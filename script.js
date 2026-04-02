document.addEventListener('DOMContentLoaded', function () {

  // ============================================================
  // 1. SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================================
  document.addEventListener('click', function (e) {
    const target = e.target.closest('a[href^="#"]');
    if (!target) return;

    const href = target.getAttribute('href');
    if (!href || href === '#') return;

    const destination = document.querySelector(href);
    if (!destination) return;

    e.preventDefault();

    const navbarEl = document.querySelector('.navbar, nav, header');
    const navbarHeight = navbarEl ? navbarEl.offsetHeight : 0;
    const elementTop = destination.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementTop - navbarHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  });

  // ============================================================
  // 2. NAVBAR SCROLL EFFECT
  // ============================================================
  const navbar = document.querySelector('.navbar, nav, header');

  if (navbar) {
    const SCROLL_THRESHOLD = 50;

    function handleNavbarScroll() {
      if (window.pageYOffset > SCROLL_THRESHOLD) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    let navbarTicking = false;
    window.addEventListener('scroll', function () {
      if (!navbarTicking) {
        window.requestAnimationFrame(function () {
          handleNavbarScroll();
          navbarTicking = false;
        });
        navbarTicking = true;
      }
    }, { passive: true });

    handleNavbarScroll();
  }

  // ============================================================
  // 3. CONTACT FORM VALIDATION
  // ============================================================
  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    function getFieldValue(field) {
      return field.value.trim();
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
      return /^[\+]?[\d\s\-\(\)]{7,20}$/.test(phone);
    }

    function setFieldError(field, message) {
      field.classList.add('field-error');
      field.classList.remove('field-success');
      field.setAttribute('aria-invalid', 'true');

      let errorEl = field.parentElement.querySelector('.error-message');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.setAttribute('role', 'alert');
        field.parentElement.appendChild(errorEl);
      }
      errorEl.textContent = message;
    }

    function setFieldSuccess(field) {
      field.classList.remove('field-error');
      field.classList.add('field-success');
      field.setAttribute('aria-invalid', 'false');

      const errorEl = field.parentElement.querySelector('.error-message');
      if (errorEl) errorEl.textContent = '';
    }

    function clearFieldState(field) {
      field.classList.remove('field-error', 'field-success');
      field.removeAttribute('aria-invalid');

      const errorEl = field.parentElement.querySelector('.error-message');
      if (errorEl) errorEl.textContent = '';
    }

    function validateField(field) {
      const value = getFieldValue(field);
      const type = field.type ? field.type.toLowerCase() : '';
      const name = (field.name || field.id || '').toLowerCase();
      const isRequired = field.hasAttribute('required');

      if (isRequired && value === '') {
        const label = contactForm.querySelector('label[for="' + field.id + '"]');
        const labelText = label ? label.textContent.replace('*', '').trim() : 'This field';
        setFieldError(field, labelText + ' is required.');
        return false;
      }

      if (value === '') {
        clearFieldState(field);
        return true;
      }

      if (type === 'email' || name.includes('email')) {
        if (!isValidEmail(value)) {
          setFieldError(field, 'Please enter a valid email address.');
          return false;
        }
      }

      if (type === 'tel' || name.includes('phone') || name.includes('tel')) {
        if (!isValidPhone(value)) {
          setFieldError(field, 'Please enter a valid phone number.');
          return false;
        }
      }

      if (field.minLength && field.minLength > 0 && value.length < field.minLength) {
        setFieldError(field, 'Must be at least ' + field.minLength + ' characters.');
        return false;
      }

      if (field.maxLength && field.maxLength > 0 && value.length > field.maxLength) {
        setFieldError(field, 'Must be no more than ' + field.maxLength + ' characters.');
        return false;
      }

      setFieldSuccess(field);
      return true;
    }

    contactForm.addEventListener('blur', function (e) {
      const field = e.target;
      if (field.matches('input, textarea, select')) {
        validateField(field);
      }
    }, true);

    contactForm.addEventListener('input', function (e) {
      const field = e.target;
      if (field.matches('input, textarea, select')) {
        if (field.classList.contains('field-error')) {
          validateField(field);
        }
      }
    });

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const fields = contactForm.querySelectorAll('input, textarea, select');
      let isFormValid = true;
      let firstInvalidField = null;

      fields.forEach(function (field) {
        if (field.type === 'submit' || field.type === 'button' || field.type === 'reset' || field.type === 'hidden') return;
        const valid = validateField(field);
        if (!valid && !firstInvalidField) {
          firstInvalidField = field;
          isFormValid = false;
        }
      });

      if (!isFormValid) {
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
        return;
      }

      const submitBtn = contactForm.querySelector('[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      const formData = new FormData(contactForm);
      const action = contactForm.getAttribute('action') || window.location.href;
      const method = (contactForm.getAttribute('method') || 'POST').toUpperCase();

      fetch(action, {
        method: method,
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            showFormMessage(contactForm, 'Your message has been sent successfully!', 'success');
            contactForm.reset();
            fields.forEach(function (field) {
              clearFieldState(field);
            });
          } else {
            return response.json().then(function (data) {
              throw new Error(data.message || 'Server error. Please try again.');
            });
          }
        })
        .catch(function (error) {
          showFormMessage(contactForm, error.message || 'Something went wrong. Please try again.', 'error');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        });
    });

    function showFormMessage(form, message, type) {
      let msgEl = form.querySelector('.form-message');
      if (!msgEl) {
        msgEl = document.createElement('div');
        msgEl.className = 'form-message';
        msgEl.setAttribute('role', 'alert');
        form.appendChild(msgEl);
      }
      msgEl.textContent = message;
      msgEl.className = 'form-message form-message--' + type;
      msgEl.style.display = 'block';

      setTimeout(function () {
        msgEl.style.display = 'none';
      }, 6000);
    }
  }

  // ============================================================
  // 4. SCROLL ANIMATIONS (FADE-IN ON SCROLL)
  // ============================================================
  const animatedElements = document.querySelectorAll(
    '.fade-in, .fade-in-up, .fade-in-down, .fade-in-left, .fade-in-right, [data-animate]'
  );

  if (animatedElements.length > 0) {
    animatedElements.forEach(function (el) {
      el.classList.add('animate-ready');
    });

    if ('IntersectionObserver' in window) {
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.12
      };

      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.getAttribute('data-delay') || 0;

            setTimeout(function () {
              el.classList.add('animate-visible');
              el.classList.remove('animate-ready');
            }, parseInt(delay, 10));

            observer.unobserve(el);
          }
        });
      }, observerOptions);

      animatedElements.forEach(function (el) {
        observer.observe(el);
      });

    } else {
      animatedElements.forEach(function (el) {
        el.classList.add('animate-visible');
        el.classList.remove('animate-ready');
      });
    }
  }

});

/* Cookie Consent */

// Helper function to check cookie consent
function hasConsentFor(category) {
  if (typeof window.CookieConsent === 'undefined') {
    return false; // Default to no consent if cookie consent not loaded
  }
  
  return window.CookieConsent.validConsent(category);
}

// Helper function to execute code only with consent
function withConsent(category, callback) {
  if (hasConsentFor(category)) {
    callback();
  } else {
    console.log(`[WARNING] Skipping ${category} code - no user consent`);
  }
}

// Cookie Consent Initialization

(function() {
  'use strict';
  
  let initAttempts = 0;
  const maxAttempts = 50; // 5 seconds max wait
  
  // Wait for DOM and vanilla-cookieconsent to be ready
  function initCookieConsent() {
    initAttempts++;
    
    
    if (typeof window.CookieConsent === 'undefined') {
      if (initAttempts < maxAttempts) {
        setTimeout(initCookieConsent, 100);
      } else {
      }
      return;
    }

    const cc = window.CookieConsent;
    
    
    // Initialize cookie consent
    try {
      cc.run({
  "autoShow": true,
  "mode": "opt-in",
  "revision": 0,
  "categories": {
    "necessary": {
      "enabled": true,
      "readOnly": true
    },
    "analytics": {
      "enabled": false,
      "readOnly": false,
      "autoClear": {
        "cookies": [
          {
            "name": "_ga"
          },
          {
            "name": "_ga_*"
          },
          {
            "name": "_gid"
          },
          {
            "name": "_gat"
          }
        ]
      }
    },
    "marketing": {
      "enabled": false,
      "readOnly": false,
      "autoClear": {
        "cookies": [
          {
            "name": "_fbp"
          },
          {
            "name": "_fbc"
          },
          {
            "name": "fr"
          }
        ]
      }
    }
  },
  "language": {
    "default": "en",
    "translations": {
      "en": {
        "consentModal": {
          "title": "We use cookies 🍪",
          "description": "Rocks of Galilee uses cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. You can manage your preferences anytime.",
          "acceptAllBtn": "Accept All",
          "acceptNecessaryBtn": "Accept Necessary",
          "showPreferencesBtn": "Manage Preferences",
          "footer": "<a href=\"#privacy-policy\">Privacy Policy</a> | <a href=\"#terms-conditions\">Terms & Conditions</a>"
        },
        "preferencesModal": {
          "title": "Cookie Preferences",
          "acceptAllBtn": "Accept All",
          "acceptNecessaryBtn": "Accept Necessary",
          "savePreferencesBtn": "Save Preferences",
          "closeIconLabel": "Close",
          "sections": [
            {
              "title": "Essential Cookies",
              "description": "These cookies are necessary for the website to function and cannot be disabled.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Analytics Cookies",
              "description": "These cookies help us understand how visitors interact with our website.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Marketing Cookies",
              "description": "These cookies are used to deliver personalized advertisements.",
              "linkedCategory": "marketing"
            }
          ]
        }
      }
    }
  },
  "guiOptions": {
    "consentModal": {
      "layout": "box",
      "position": "bottom right",
      "equalWeightButtons": true,
      "flipButtons": false
    },
    "preferencesModal": {
      "layout": "box",
      "equalWeightButtons": true,
      "flipButtons": false
    }
  }
});
      
      // Google Consent Mode v2 integration
      // Update consent state based on accepted cookie categories
      function updateGoogleConsentMode() {
        if (typeof gtag !== 'function') {
          // Define gtag if not already defined (needed for consent updates)
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){dataLayer.push(arguments);};
        }
        
        var analyticsAccepted = cc.acceptedCategory('analytics');
        var marketingAccepted = cc.acceptedCategory('marketing');
        
        gtag('consent', 'update', {
          'analytics_storage': analyticsAccepted ? 'granted' : 'denied',
          'ad_storage': marketingAccepted ? 'granted' : 'denied',
          'ad_user_data': marketingAccepted ? 'granted' : 'denied',
          'ad_personalization': marketingAccepted ? 'granted' : 'denied'
        });
      }
      
      // Update consent on initial load (if user previously accepted)
      updateGoogleConsentMode();
      
      // Handle consent changes via onChange callback
      if (typeof cc.onChange === 'function') {
        cc.onChange(function(cookie, changed_preferences) {
          updateGoogleConsentMode();
        });
      }

      // Note: Cookie Preferences button removed per marketing guidelines
      // Footer should be clean and minimal - users can manage cookies via banner
    } catch (error) {
    }
  }

  // Initialize when DOM is ready - multiple approaches for reliability
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
    // Backup timeout in case DOMContentLoaded doesn't fire
    setTimeout(initCookieConsent, 1000);
  } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initCookieConsent();
  } else {
    // Fallback - try after a short delay
    setTimeout(initCookieConsent, 500);
  }
  
  // Additional fallback - try after page load
  if (typeof window !== 'undefined') {
    if (window.addEventListener) {
      window.addEventListener('load', initCookieConsent, { once: true });
    }
  }
})();

/* Accessibility Features */

/* Mickidum Accessibility Toolbar Initialization - Zappy Style */

window.onload = function() {
    
    try {
        window.micAccessTool = new MicAccessTool({
            buttonPosition: 'left', // Position on left side
            forceLang: 'en-US', // Force language
            icon: {
                position: {
                    bottom: { size: 50, units: 'px' },
                    left: { size: 20, units: 'px' },
                    type: 'fixed'
                },
                backgroundColor: 'transparent', // Transparent to allow CSS styling
                color: 'transparent', // Let CSS handle coloring
                img: 'accessible',
                circular: false // Square button for consistent styling
            },
            menu: {
                dimensions: {
                    width: { size: 300, units: 'px' },
                    height: { size: 'auto', units: 'px' }
                }
            }
        });
        
    } catch (error) {
    }
    
    // Keyboard shortcut handler: ALT+A (Option+A on Mac) to toggle accessibility widget visibility (desktop only)
    document.addEventListener('keydown', function(event) {
        // Check if ALT+A is pressed (ALT on Windows/Linux, Option on Mac)
        var isAltOrOption = event.altKey;
        // Use event.code for reliable physical key detection (works regardless of Option key character output)
        var isAKey = event.code === 'KeyA' || event.keyCode === 65 || event.which === 65 || 
                      (event.key && (event.key.toLowerCase() === 'a' || event.key === 'å' || event.key === 'Å'));
        
        if (isAltOrOption && isAKey) {
            // Only work on desktop (screen width > 768px)
            if (window.innerWidth > 768) {
                event.preventDefault();
                event.stopPropagation();
                
                // Toggle visibility class on body
                var isVisible = document.body.classList.contains('accessibility-widget-visible');
                
                if (isVisible) {
                    // Hide the widget
                    document.body.classList.remove('accessibility-widget-visible');
                } else {
                    // Show the widget
                    document.body.classList.add('accessibility-widget-visible');
                    
                    // After a short delay, click the button to open the menu
                    setTimeout(function() {
                        var accessButton = document.getElementById('mic-access-tool-general-button');
                        if (accessButton) {
                            accessButton.click();
                        }
                    }, 200);
                }
            }
        }
    }, true);
};


// Zappy Contact Form API Integration (Fallback)
(function() {
    if (window.zappyContactFormLoaded) {
        console.log('📧 Zappy contact form already loaded');
        return;
    }
    window.zappyContactFormLoaded = true;

    function zappyNotify(message, type) {
        var existing = document.querySelectorAll('.zappy-notification');
        existing.forEach(function(el) { el.remove(); });
        var el = document.createElement('div');
        el.className = 'zappy-notification';
        var bg = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1';
        var fg = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460';
        var border = type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb';
        var icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        el.style.cssText = 'position:fixed;top:20px;right:20px;max-width:400px;padding:16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.4;animation:slideInRight .3s ease-out;background:' + bg + ';color:' + fg + ';border:1px solid ' + border;
        el.innerHTML = '<span style="margin-right:8px">' + icon + '</span>' + message + '<button onclick="this.parentElement.remove()" style="background:none;border:none;font-size:18px;cursor:pointer;float:right;opacity:.7;padding:0 0 0 12px">&times;</button>';
        if (!document.getElementById('zappy-notify-anim')) {
            var s = document.createElement('style');
            s.id = 'zappy-notify-anim';
            s.textContent = '@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
            document.head.appendChild(s);
        }
        document.body.appendChild(el);
        setTimeout(function() { if (el.parentElement) el.remove(); }, type === 'error' ? 8000 : 5000);
    }

    function initContactFormIntegration() {
        console.log('📧 Zappy: Initializing contact form API integration...');

        var contactForm = document.querySelector('.contact-form') || 
                           document.querySelector('form[action*="contact"]') ||
                           document.querySelector('form#contact') ||
                           document.querySelector('form#contactForm') ||
                           document.getElementById('contactForm') ||
                           document.querySelector('section.contact form') ||
                           document.querySelector('section#contact form') ||
                           document.querySelector('form');
        
        if (!contactForm) {
            console.log('⚠️ Zappy: No contact form found on page');
            return;
        }
        
        console.log('✅ Zappy: Contact form found:', contactForm.className || contactForm.id || 'unnamed form');

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate privacy consent checkbox if present (required for GDPR)
        var privacyCheckbox = this.querySelector('.privacy-consent-checkbox');
        if (privacyCheckbox && !privacyCheckbox.checked) {
            zappyNotify('Please accept the Terms & Conditions and Privacy Policy to continue', 'error');
            privacyCheckbox.focus();
            return;
        }

        // Collect form data with multi-value support (checkboxes, multi-selects)
        var formData = new FormData(this);
        var data = {};
        for (var pair of formData.entries()) {
            if (data[pair[0]] !== undefined) {
                if (Array.isArray(data[pair[0]])) data[pair[0]].push(pair[1]);
                else data[pair[0]] = [data[pair[0]], pair[1]];
            } else {
                data[pair[0]] = pair[1];
            }
        }

        // Smart field mapping
        var _coreNameFields = ['name','firstName','first_name','fname','lastName','last_name','lname'];
        var _coreEmailFields = ['email','emailAddress','mail','e-mail'];
        var _corePhoneFields = ['phone','tel','telephone','mobile','cellphone'];
        var _coreMsgFields = ['message','msg','comments','comment','description','details','notes','body','text','inquiry'];
        var _coreSubjectFields = ['subject','topic','regarding','re'];
        var _allCoreFields = [].concat(_coreNameFields, _coreEmailFields, _corePhoneFields, _coreMsgFields, _coreSubjectFields);

        var resolvedName = (data.name || '').trim()
            || [data.firstName || data.first_name || data.fname || '', data.lastName || data.last_name || data.lname || ''].filter(Boolean).join(' ').trim()
            || (data.email || data.emailAddress || data.mail || '').trim()
            || 'Anonymous';
        var resolvedEmail = (data.email || data.emailAddress || data.mail || data['e-mail'] || '').trim();
        var resolvedPhone = data.phone || data.tel || data.telephone || data.mobile || data.cellphone || null;
        var resolvedSubject = data.subject || data.topic || data.regarding || data.re || 'Contact Form Submission';
        var resolvedMessage = (data.message || data.msg || data.comments || data.comment || data.description || data.details || data.body || data.text || data.inquiry || '').trim();
        if (!resolvedMessage) {
            var extraEntries = Object.entries(data).filter(function(e) { return _allCoreFields.indexOf(e[0]) === -1; });
            if (extraEntries.length > 0) {
                resolvedMessage = extraEntries.map(function(e) {
                    var label = e[0].replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim();
                    var val = Array.isArray(e[1]) ? e[1].join(', ') : e[1];
                    return label + ': ' + val;
                }).join('\n');
            } else {
                resolvedMessage = 'Form submission from ' + window.location.pathname;
            }
        }

        var extraFields = {};
        for (var k of Object.keys(data)) {
            if (_allCoreFields.indexOf(k) === -1 && data[k] !== '' && data[k] !== null && data[k] !== undefined) {
                extraFields[k] = data[k];
            }
        }

        // Loading state
        var submitBtn = this.querySelector('button[type="submit"], input[type="submit"]');
        var originalText = submitBtn ? (submitBtn.value || submitBtn.textContent) : '';
        if (submitBtn) {
            if (submitBtn.tagName === 'INPUT') submitBtn.value = 'Sending...';
            else submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
        }

        var currentPagePath = window.location.pathname;
        if (window.ZAPPY_CONFIG && window.ZAPPY_CONFIG.currentPagePath) {
            currentPagePath = window.ZAPPY_CONFIG.currentPagePath;
        } else {
            try {
                var p = new URLSearchParams(window.location.search).get('page');
                if (p) currentPagePath = p;
            } catch (ignored) {}
        }

        var theForm = this;
        try {
            console.log('📧 Zappy: Sending contact form to backend API...');
            var apiBase = (window.ZAPPY_API_BASE || 'https://api.zappy5.com').replace(/\/$/, '');
            var payload = {
                websiteId: 'f61e3543-fcb1-4409-8c2d-95c8b4daf287',
                name: resolvedName,
                email: resolvedEmail,
                subject: resolvedSubject,
                message: resolvedMessage,
                phone: resolvedPhone,
                currentPagePath: currentPagePath
            };
            if (Object.keys(extraFields).length > 0) {
                payload.extraFields = extraFields;
            }
            var response = await fetch(apiBase + '/api/email/contact-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            var result = await response.json();
            
            if (result.success) {
                console.log('✅ Zappy: Contact form data sent successfully to backend');

                // Thank-you page redirect
                if (result.thankYouPagePath && result.ticketNumber) {
                    var ticketParam = 'ticket=' + encodeURIComponent(result.ticketNumber);
                    var isPreview = window.location.pathname.indexOf('/preview') !== -1;
                    var thankYouUrl;
                    if (isPreview && window.ZAPPY_CONFIG) {
                        var wid = window.ZAPPY_CONFIG.websiteId || 'f61e3543-fcb1-4409-8c2d-95c8b4daf287';
                        var pt = window.location.pathname.indexOf('fullscreen') !== -1 ? 'preview-fullscreen' : 'preview';
                        thankYouUrl = window.location.origin + '/api/website/' + pt + '/' + wid + '?page=' + encodeURIComponent(result.thankYouPagePath) + '&' + ticketParam;
                        if (window.ZAPPY_CONFIG.authToken) thankYouUrl += '&auth_token=' + encodeURIComponent(window.ZAPPY_CONFIG.authToken);
                    } else {
                        thankYouUrl = result.thankYouPagePath + '?' + ticketParam;
                    }
                    window.location.href = thankYouUrl;
                    return;
                }

                var _siteLang = document.documentElement.lang || '';
                var _isHeSite = _siteLang === 'he' || (_siteLang !== 'ar' && document.documentElement.dir === 'rtl');
                var _isArSite = _siteLang === 'ar';
                var _successFallback = _isHeSite ? 'ההודעה שלך נשלחה בהצלחה! נחזור אליך בהקדם.' : _isArSite ? 'تم إرسال رسالتك بنجاح! سنرد عليك قريبًا.' : 'Thank you for your message! We\'ll get back to you soon.';
                zappyNotify(result.message || _successFallback, 'success');
                theForm.reset();
            } else {
                console.log('⚠️ Zappy: Backend returned error:', result.error);
                var _isHeSiteErr = _siteLang === 'he' || (_siteLang !== 'ar' && document.documentElement.dir === 'rtl');
                var _isArSiteErr = _siteLang === 'ar';
                var _errFallback = _isHeSiteErr ? 'שליחת ההודעה נכשלה. אנא נסו שוב.' : _isArSiteErr ? 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.' : 'Failed to send message. Please try again.';
                zappyNotify(result.error || _errFallback, 'error');
            }
        } catch (error) {
            console.error('❌ Zappy: Failed to send to backend API:', error);
            var _isHeSiteNet = _siteLang === 'he' || (_siteLang !== 'ar' && document.documentElement.dir === 'rtl');
            var _isArSiteNet = _siteLang === 'ar';
            var _netFallback = _isHeSiteNet ? 'לא ניתן לשלוח הודעה כרגע. אנא נסו שוב מאוחר יותר.' : _isArSiteNet ? 'لا يمكن إرسال الرسالة الآن. يرجى المحاولة مرة أخرى لاحقًا.' : 'Unable to send message right now. Please try again later.';
            zappyNotify(_netFallback, 'error');
        } finally {
            if (submitBtn) {
                if (submitBtn.tagName === 'INPUT') submitBtn.value = originalText;
                else submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
        }, true);

        console.log('✅ Zappy: Contact form API integration initialized');
    } // End of initContactFormIntegration
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContactFormIntegration);
    } else {
        initContactFormIntegration();
    }
})();


/* ZAPPY_PUBLISHED_LIGHTBOX_RUNTIME */
(function(){
  try {
    if (window.__zappyPublishedLightboxInit) return;
    window.__zappyPublishedLightboxInit = true;

    function safeText(s){ try { return String(s || '').replace(/"/g,'&quot;'); } catch(e){ return ''; } }

    function ensureOverlayForToggle(toggle){
      try {
        if (!toggle || !toggle.id) return;
        if (toggle.id.indexOf('zappy-lightbox-toggle-') !== 0) return;
        var elementId = toggle.id.replace('zappy-lightbox-toggle-','');
        var label = document.querySelector('label.zappy-lightbox-trigger[for="' + toggle.id + '"]');
        if (!label) return;

        // If toggle is inside the label (corrupted), move it before the label so the for attribute works consistently.
        try {
          if (label.contains(toggle) && label.parentNode) {
            label.parentNode.insertBefore(toggle, label);
          }
        } catch (e0) {}

        var lightboxId = 'zappy-lightbox-' + elementId;
        var lb = document.getElementById(lightboxId);
        if (lb && lb.parentNode !== document.body) {
          try { document.body.appendChild(lb); } catch (eMove) {}
        }

        if (!lb) {
          var img = null;
          try { img = label.querySelector('img'); } catch (eImg0) {}
          if (!img) {
            try { img = document.querySelector('img[data-element-id="' + elementId + '"]'); } catch (eImg1) {}
          }
          if (!img) return;

          lb = document.createElement('div');
          lb.id = lightboxId;
          lb.className = 'zappy-lightbox';
          lb.setAttribute('data-zappy-image-lightbox','true');
          lb.style.display = 'none';
          lb.innerHTML =
            '<label class="zappy-lightbox-backdrop" for="' + toggle.id + '" aria-label="Close"></label>' +
            '<div class="zappy-lightbox-content">' +
              '<label class="zappy-lightbox-close" for="' + toggle.id + '" aria-label="Close">×</label>' +
              '<img class="zappy-lightbox-image" src="' + safeText(img.currentSrc || img.src || img.getAttribute('src')) + '" alt="' + safeText(img.getAttribute('alt') || 'Image') + '">' +
            '</div>';
          document.body.appendChild(lb);
        }

        // Keep overlay image in sync at open time (in case src changed / responsive currentSrc)
        function syncOverlayImage(){
          try {
            var imgCur = label.querySelector('img');
            var imgLb = lb.querySelector('img');
            if (imgCur && imgLb) {
              imgLb.src = imgCur.currentSrc || imgCur.src || imgLb.src;
              imgLb.alt = imgCur.alt || imgLb.alt;
            }
          } catch (eSync) {}
        }

        if (!toggle.__zappyLbBound) {
          toggle.addEventListener('change', function(){
            if (toggle.checked) syncOverlayImage();
            lb.style.display = toggle.checked ? 'flex' : 'none';
          });
          toggle.__zappyLbBound = true;
        }

        if (!lb.__zappyLbBound) {
          lb.addEventListener('click', function(ev){
            try {
              var t = ev.target;
              if (!t) return;
              if (t.classList && (t.classList.contains('zappy-lightbox-backdrop') || t.classList.contains('zappy-lightbox-close'))) {
                ev.preventDefault();
                toggle.checked = false;
                lb.style.display = 'none';
              }
            } catch (e2) {}
          });
          lb.__zappyLbBound = true;
        }

        if (!label.__zappyLbClick) {
          label.addEventListener('click', function(ev){
            try {
              if (document.body && document.body.classList && document.body.classList.contains('zappy-edit-mode')) return;
              if (ev && ev.target && ev.target.closest && ev.target.closest('a[href],button,input,select,textarea')) return;
              ev.preventDefault();
              ev.stopPropagation();
              toggle.checked = true;
              syncOverlayImage();
              lb.style.display = 'flex';
            } catch (e3) {}
          }, true);
          label.__zappyLbClick = true;
        }
      } catch (e) {}
    }

    function ensureLightboxCss(){
      try {
        var head = document.head || document.querySelector('head');
        if (!head || head.querySelector('style[data-zappy-image-lightbox="true"]')) return;
        var s = document.createElement('style');
        s.setAttribute('data-zappy-image-lightbox','true');
        s.textContent =
          '.zappy-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:9999;padding:24px;}'+
          '.zappy-lightbox-content{position:relative;max-width:min(1100px,92vw);max-height:92vh;}'+
          '.zappy-lightbox-content img{max-width:92vw;max-height:92vh;display:block;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.45);}'+
          '.zappy-lightbox-close{position:absolute;top:-14px;right:-14px;width:32px;height:32px;border-radius:999px;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;}'+
          '.zappy-lightbox-backdrop{position:absolute;inset:0;display:block;cursor:pointer;}'+
          'input.zappy-lightbox-toggle{position:absolute;opacity:0;pointer-events:none;}'+
          'label.zappy-lightbox-trigger{display:contents;}'+
          'label.zappy-lightbox-trigger{cursor:zoom-in;}'+
          'label.zappy-lightbox-trigger [data-zappy-zoom-wrapper="true"],'+
          'label.zappy-lightbox-trigger img{cursor:zoom-in !important;}'+
          'input.zappy-lightbox-toggle:checked + label.zappy-lightbox-trigger + .zappy-lightbox{display:flex;}';
        head.appendChild(s);
      } catch(e){}
    }

    function initZappyPublishedLightboxes(){
      try {
        ensureLightboxCss();
        // Repair orphaned labels (label has for=toggleId but input is missing)
        var orphanLabels = document.querySelectorAll('label.zappy-lightbox-trigger[for^="zappy-lightbox-toggle-"]');
        for (var i=0;i<orphanLabels.length;i++){
          var lbl = orphanLabels[i];
          var forId = lbl && lbl.getAttribute ? lbl.getAttribute('for') : null;
          if (!forId) continue;
          if (!document.getElementById(forId)) {
            var t = document.createElement('input');
            t.type = 'checkbox';
            t.id = forId;
            t.className = 'zappy-lightbox-toggle';
            t.setAttribute('data-zappy-image-lightbox','true');
            if (lbl.parentNode) lbl.parentNode.insertBefore(t, lbl);
          }
        }

        var toggles = document.querySelectorAll('input.zappy-lightbox-toggle[id^="zappy-lightbox-toggle-"]');
        for (var j=0;j<toggles.length;j++){
          ensureOverlayForToggle(toggles[j]);
        }

        // Close on ESC if any lightbox is open
        if (!document.__zappyLbEscBound) {
          document.addEventListener('keydown', function(ev){
            try {
              if (!ev || ev.key !== 'Escape') return;
              var openLb = document.querySelector('.zappy-lightbox[style*="display: flex"]');
              if (openLb) {
                var openToggle = null;
                try {
                  var id = openLb.id || '';
                  if (id.indexOf('zappy-lightbox-') === 0) {
                    openToggle = document.getElementById('zappy-lightbox-toggle-' + id.replace('zappy-lightbox-',''));
                  }
                } catch (e4) {}
                if (openToggle) openToggle.checked = false;
                openLb.style.display = 'none';
              }
            } catch (e5) {}
          });
          document.__zappyLbEscBound = true;
        }
      } catch (eInit) {}
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initZappyPublishedLightboxes, { once: true });
    } else {
      initZappyPublishedLightboxes();
    }
  } catch (eOuter) {}
})();
/* END ZAPPY_PUBLISHED_LIGHTBOX_RUNTIME */


/* ZAPPY_PUBLISHED_ZOOM_WRAPPER_RUNTIME */
(function(){
  try {
    if (window.__zappyPublishedZoomInit) return;
    window.__zappyPublishedZoomInit = true;

    function parseObjPos(op) {
      var x = 50, y = 50;
      try {
        if (typeof op === 'string') {
          var m = op.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
          if (m) { x = parseFloat(m[1]); y = parseFloat(m[2]); }
        }
      } catch (e) {}
      if (!isFinite(x)) x = 50; if (!isFinite(y)) y = 50;
      return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    }

    function coverPercents(imgA, contA) {
      if (!isFinite(imgA) || imgA <= 0 || !isFinite(contA) || contA <= 0)
        return { w: 100, h: 100 };
      if (imgA >= contA) return { w: (imgA / contA) * 100, h: 100 };
      return { w: 100, h: (contA / imgA) * 100 };
    }

    function applyZoom(wrapper, img) {
      var zoom = parseFloat(img.getAttribute('data-zappy-zoom')) || 1;
      if (!(zoom > 0)) zoom = 1;

      var widthMode = wrapper.getAttribute('data-zappy-zoom-wrapper-width-mode');
      if (widthMode === 'full') return;

      var isMobile = window.innerWidth <= 768;
      if (isMobile) {
        img.style.setProperty('position', 'relative', 'important');
        img.style.setProperty('width', '100%', 'important');
        img.style.setProperty('height', 'auto', 'important');
        img.style.setProperty('max-width', '100%', 'important');
        img.style.setProperty('display', 'block', 'important');
        img.style.setProperty('object-fit', 'cover', 'important');
        img.style.removeProperty('left');
        img.style.removeProperty('top');
        img.style.setProperty('margin', '0', 'important');
        return;
      }

      // Desktop: if the image already has zoom styles saved from the editor
      // (position:absolute + percentage-based width), trust them.
      // The saved percentages are proportional and correct for any container size,
      // since zoom/crop math is based purely on aspect ratios.
      // Recalculating here can produce different values when the container
      // dimensions differ between preview and deployed site.
      var existingPos = (img.style.position || '').replace(/s*!importants*/g, '').trim();
      var existingW = (img.style.width || '').replace(/s*!importants*/g, '').trim();
      if (existingPos === 'absolute' && existingW.indexOf('%') !== -1) {
        wrapper.style.setProperty('overflow', 'hidden', 'important');
        wrapper.style.setProperty('position', 'relative', 'important');
        return;
      }

      // Image lacks saved zoom styles — calculate from scratch
      var rect = wrapper.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height) return;

      var nW = img.naturalWidth || 0, nH = img.naturalHeight || 0;
      if (!(nW > 0 && nH > 0)) return;

      var imgA = nW / nH;
      var contA = rect.width / rect.height;
      var cover = coverPercents(imgA, contA);

      var wPct = 100, hPct = 100;
      if (zoom >= 1) {
        wPct = cover.w * zoom;
        hPct = cover.h * zoom;
      } else {
        var t = (zoom - 0.5) / 0.5;
        if (!isFinite(t)) t = 0;
        t = Math.max(0, Math.min(1, t));
        wPct = 100 + t * (cover.w - 100);
        hPct = 100 + t * (cover.h - 100);
      }

      var op = img.style.objectPosition || window.getComputedStyle(img).objectPosition || '50% 50%';
      var pos = parseObjPos(op);
      var leftPct = (100 - wPct) * (pos.x / 100);
      var topPct = (100 - hPct) * (pos.y / 100);

      img.style.setProperty('position', 'absolute', 'important');
      img.style.setProperty('left', leftPct + '%', 'important');
      img.style.setProperty('top', topPct + '%', 'important');
      img.style.setProperty('width', wPct + '%', 'important');
      img.style.setProperty('height', hPct + '%', 'important');
      img.style.setProperty('max-width', 'none', 'important');
      img.style.setProperty('max-height', 'none', 'important');
      img.style.setProperty('display', 'block', 'important');
      img.style.setProperty('object-fit', zoom < 1 ? 'fill' : 'cover', 'important');
      img.style.setProperty('margin', '0', 'important');
    }

    function fixOrphanedZoomImages() {
      if (window.innerWidth > 768) return;
      var zoomImgs = document.querySelectorAll('img[data-zappy-zoom]');
      for (var j = 0; j < zoomImgs.length; j++) {
        var img = zoomImgs[j];
        if (img.closest && img.closest('[data-zappy-zoom-wrapper="true"]')) continue;
        img.style.setProperty('position', 'relative', 'important');
        img.style.setProperty('width', '100%', 'important');
        img.style.setProperty('height', 'auto', 'important');
        img.style.setProperty('max-width', '100%', 'important');
        img.style.setProperty('max-height', '300px', 'important');
        img.style.setProperty('object-fit', 'cover', 'important');
        img.style.removeProperty('left');
        img.style.removeProperty('top');
      }
    }

    function restoreWrapperDimensions(wrapper) {
      var widthMode = wrapper.getAttribute('data-zappy-zoom-wrapper-width-mode') || 'px';
      if (widthMode === 'full' || widthMode === 'grid-responsive') return;

      var storedW = wrapper.getAttribute('data-zappy-zoom-wrapper-width');
      var storedH = wrapper.getAttribute('data-zappy-zoom-wrapper-height');
      if (!storedW && !storedH) return;

      if (widthMode === 'px' && storedW) {
        var curW = (wrapper.style.width || '').replace(/s*!importants*/g, '').trim();
        if (!curW || curW === '100%' || curW.indexOf('%') !== -1) {
          wrapper.style.setProperty('width', storedW, 'important');
          wrapper.style.setProperty('max-width', '100%', 'important');
        }
      }
      if (storedH) {
        var curH = (wrapper.style.height || '').replace(/s*!importants*/g, '').trim();
        if (!curH || curH === 'auto' || curH === '100%' || curH.indexOf('%') !== -1) {
          wrapper.style.setProperty('height', storedH, 'important');
        }
      }
      wrapper.style.setProperty('overflow', 'hidden', 'important');
      wrapper.style.setProperty('position', 'relative', 'important');
    }

    function initZoomWrappers() {
      var wrappers = document.querySelectorAll('[data-zappy-zoom-wrapper="true"]');
      for (var i = 0; i < wrappers.length; i++) {
        (function(wrapper) {
          var img = wrapper.querySelector('img');
          if (!img) return;
          if (wrapper.closest && wrapper.closest('.zappy-carousel-js-init, .zappy-carousel-active')) return;
          if (window.innerWidth > 768) restoreWrapperDimensions(wrapper);
          if (img.complete && img.naturalWidth > 0) {
            setTimeout(function() { applyZoom(wrapper, img); }, 0);
          } else {
            img.addEventListener('load', function onLoad() {
              img.removeEventListener('load', onLoad);
              applyZoom(wrapper, img);
            }, { once: true });
          }
        })(wrappers[i]);
      }
      fixOrphanedZoomImages();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initZoomWrappers, { once: true });
    } else {
      setTimeout(initZoomWrappers, 50);
    }
  } catch (eOuter) {}
})();
/* END ZAPPY_PUBLISHED_ZOOM_WRAPPER_RUNTIME */


/* ZAPPY_MOBILE_MENU_TOGGLE */
(function(){
  try {
    if (window.__zappyMobileMenuToggleInit) return;
    window.__zappyMobileMenuToggleInit = true;

    function initMobileToggle() {
      var toggle = document.querySelector('.mobile-toggle, #mobileToggle');
      var navMenu = document.querySelector('#navMenu, .nav-menu, .navbar-menu');
      if (!toggle || !navMenu) return;

      // Skip if this toggle already has a click handler from the site's own JS
      if (toggle.__zappyMobileToggleBound) return;
      toggle.__zappyMobileToggleBound = true;

      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var hamburgerIcon = toggle.querySelector('.hamburger-icon');
        var closeIcon = toggle.querySelector('.close-icon');
        var isOpen = navMenu.classList.contains('active') || navMenu.style.display === 'block';

        if (isOpen) {
          navMenu.classList.remove('active');
          navMenu.style.display = '';
          if (hamburgerIcon) hamburgerIcon.style.setProperty('display', 'block', 'important');
          if (closeIcon) closeIcon.style.setProperty('display', 'none', 'important');
          document.body.style.overflow = '';
        } else {
          navMenu.classList.add('active');
          navMenu.style.display = 'block';
          if (hamburgerIcon) hamburgerIcon.style.setProperty('display', 'none', 'important');
          if (closeIcon) closeIcon.style.setProperty('display', 'block', 'important');
          document.body.style.overflow = 'hidden';
        }
      }, true);

      // Close on clicking outside
      document.addEventListener('click', function(e) {
        if (!navMenu.classList.contains('active')) return;
        if (toggle.contains(e.target) || navMenu.contains(e.target)) return;
        navMenu.classList.remove('active');
        navMenu.style.display = '';
        var hi = toggle.querySelector('.hamburger-icon');
        var ci = toggle.querySelector('.close-icon');
        if (hi) hi.style.setProperty('display', 'block', 'important');
        if (ci) ci.style.setProperty('display', 'none', 'important');
        document.body.style.overflow = '';
      });

      // Close on Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
          navMenu.style.display = '';
          var hi = toggle.querySelector('.hamburger-icon');
          var ci = toggle.querySelector('.close-icon');
          if (hi) hi.style.setProperty('display', 'block', 'important');
          if (ci) ci.style.setProperty('display', 'none', 'important');
          document.body.style.overflow = '';
        }
      });

      // Close when clicking a nav link (navigating)
      navMenu.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          navMenu.classList.remove('active');
          navMenu.style.display = '';
          var hi = toggle.querySelector('.hamburger-icon');
          var ci = toggle.querySelector('.close-icon');
          if (hi) hi.style.setProperty('display', 'block', 'important');
          if (ci) ci.style.setProperty('display', 'none', 'important');
          document.body.style.overflow = '';
        });
      });
    }

    function initPhoneButton() {
      var phoneBtn = document.querySelector('.phone-header-btn');
      if (!phoneBtn || phoneBtn.__zappyPhoneBound) return;
      phoneBtn.__zappyPhoneBound = true;

      phoneBtn.addEventListener('click', function() {
        var phoneNumber = phoneBtn.getAttribute('data-phone') || null;

        if (!phoneNumber) {
          var telLinks = document.querySelectorAll('a[href^="tel:"]');
          if (telLinks.length > 0) {
            phoneNumber = telLinks[0].getAttribute('href').replace('tel:', '');
          }
        }

        if (!phoneNumber) {
          var allLinks = document.querySelectorAll('a[href]');
          for (var i = 0; i < allLinks.length; i++) {
            var h = allLinks[i].getAttribute('href') || '';
            var cleaned = h.replace(/[-\s()]/g, '');
            if (/^(\+?\d{9,15}|0\d{8,9})$/.test(cleaned)) {
              phoneNumber = cleaned;
              break;
            }
          }
        }

        if (phoneNumber && phoneNumber.indexOf('[') === -1) {
          window.location.href = 'tel:' + phoneNumber;
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { initMobileToggle(); initPhoneButton(); }, { once: true });
    } else {
      initMobileToggle();
      initPhoneButton();
    }
  } catch (e) {}
})();
/* END ZAPPY_MOBILE_MENU_TOGGLE */


/* ZAPPY_FAQ_ACCORDION_TOGGLE */
(function(){
  try {
    if (window.__zappyFaqToggleInit) return;
    window.__zappyFaqToggleInit = true;

    var answerSel = '[class*="faq-answer"], [class*="faq-content"], [class*="faq-body"], .accordion-content, .accordion-body';

    function initFaqToggle() {
      var items = document.querySelectorAll('[class*="faq-item"], .accordion-item');
      if (!items.length) return;

      items.forEach(function(item) {
        var question = item.querySelector(
          '[class*="faq-question"], [class*="faq-header"], .accordion-header, .accordion-toggle'
        );
        if (!question) return;
        if (question.__zappyFaqBound) return;
        question.__zappyFaqBound = true;
        question.style.cursor = 'pointer';

        question.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();

          var parent = item.parentElement;
          if (parent) {
            var siblings = parent.querySelectorAll('[class*="faq-item"], .accordion-item');
            siblings.forEach(function(sib) {
              if (sib !== item && sib.classList.contains('active')) {
                sib.classList.remove('active');
                var sibQ = sib.querySelector('[class*="faq-question"], [class*="faq-header"], .accordion-header');
                if (sibQ) sibQ.setAttribute('aria-expanded', 'false');
                var sibA = sib.querySelector(answerSel);
                if (sibA) {
                  sibA.style.maxHeight = '0';
                  sibA.style.overflow = 'hidden';
                  sibA.style.opacity = '0';
                  sibA.style.paddingTop = '0';
                  sibA.style.paddingBottom = '0';
                }
              }
            });
          }

          var isActive = item.classList.toggle('active');
          question.setAttribute('aria-expanded', isActive ? 'true' : 'false');

          var answer = item.querySelector(answerSel);
          if (answer) {
            answer.style.transition = 'max-height 0.35s ease, opacity 0.25s ease, padding 0.25s ease';
            if (isActive) {
              answer.style.display = '';
              answer.style.maxHeight = answer.scrollHeight + 'px';
              answer.style.overflow = 'hidden';
              answer.style.opacity = '1';
              answer.style.paddingTop = '';
              answer.style.paddingBottom = '';
            } else {
              answer.style.maxHeight = '0';
              answer.style.overflow = 'hidden';
              answer.style.opacity = '0';
              answer.style.paddingTop = '0';
              answer.style.paddingBottom = '0';
            }
          }

          var chevron = question.querySelector('[class*="chevron"], [class*="icon"], svg');
          if (chevron) {
            chevron.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
            chevron.style.transition = 'transform 0.3s ease';
          }
        });
      });

      items.forEach(function(item) {
        if (item.classList.contains('active')) return;
        var answer = item.querySelector(answerSel);
        if (answer) {
          answer.style.maxHeight = '0';
          answer.style.overflow = 'hidden';
          answer.style.opacity = '0';
          answer.style.paddingTop = '0';
          answer.style.paddingBottom = '0';
          answer.style.transition = 'max-height 0.35s ease, opacity 0.25s ease, padding 0.25s ease';
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFaqToggle, { once: true });
    } else {
      initFaqToggle();
    }
  } catch (e) {}
})();
/* END ZAPPY_FAQ_ACCORDION_TOGGLE */


/* ZAPPY_NAV_SCROLL_PADDING */
(function(){
  try {
    if (window.__zappyNavScrollPaddingInit) return;
    window.__zappyNavScrollPaddingInit = true;
    function updateScrollPadding() {
      var nav = document.querySelector('nav.navbar') || document.querySelector('nav') || document.querySelector('header');
      if (!nav) return;
      var s = window.getComputedStyle(nav);
      if (s.position !== 'fixed' && s.position !== 'sticky') return;
      var h = nav.offsetHeight;
      if (h > 0) document.documentElement.style.scrollPaddingTop = h + 'px';
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateScrollPadding, { once: true });
    } else {
      updateScrollPadding();
    }
    window.addEventListener('resize', updateScrollPadding, { passive: true });
  } catch (e) {}
})();
/* END ZAPPY_NAV_SCROLL_PADDING */


/* ZAPPY_CONTACT_FORM_PREVENT_DEFAULT */
(function(){
  try {
    var _kw=['contact','booking','inquiry','enquiry','register','signup','sign-up','order','request','apply'];
    function isContactForm(form) {
      var cls=(form.className||'').toLowerCase();
      var id=(form.id||'').toLowerCase();
      var act=(form.getAttribute('action')||'').toLowerCase();
      if(_kw.some(function(k){return cls.indexOf(k)!==-1||id.indexOf(k)!==-1||act.indexOf(k)!==-1;})) return true;
      var sec=form.closest&&form.closest('section');
      if(sec){
        var sc=(sec.className||'').toLowerCase();
        var si=(sec.id||'').toLowerCase();
        if(_kw.some(function(k){return sc.indexOf(k)!==-1||si.indexOf(k)!==-1;})) return true;
        if(sc.indexOf('form-section')!==-1||sc.indexOf('form_section')!==-1) return true;
      }
      if(window.zappyContactFormLoaded){
        var inputs=form.querySelectorAll('input,textarea,select');
        var hasEmail=false,hasPassword=false,visibleCount=0;
        for(var i=0;i<inputs.length;i++){
          var inp=inputs[i];
          var t=(inp.type||'').toLowerCase();
          var n=(inp.name||'').toLowerCase();
          if(t==='hidden'||t==='submit'||t==='button'||t==='reset') continue;
          visibleCount++;
          if(t==='email'||n.indexOf('email')!==-1||n.indexOf('mail')!==-1) hasEmail=true;
          if(t==='password') hasPassword=true;
        }
        if(hasEmail&&visibleCount>=2&&!hasPassword) return true;
      }
      return false;
    }

    function showFormFeedback(form, msg, type) {
      var old = form.querySelector('.zappy-form-feedback');
      if (old) old.remove();

      var bg = type==='success'?'#d4edda':type==='error'?'#f8d7da':'#d1ecf1';
      var fg = type==='success'?'#155724':type==='error'?'#721c24':'#0c5460';
      var bd = type==='success'?'#c3e6cb':type==='error'?'#f5c6cb':'#bee5eb';
      var ic = type==='success'?'\u2705':type==='error'?'\u274C':'\u2139\uFE0F';

      var el = document.createElement('div');
      el.className = 'zappy-form-feedback';
      el.setAttribute('role', 'alert');
      el.style.cssText = 'padding:14px 18px;border-radius:8px;margin:12px 0 0;font-size:14px;line-height:1.5;background:'+bg+';color:'+fg+';border:1px solid '+bd+';text-align:center;font-family:inherit;';
      el.innerHTML = '<span style="margin-inline-end:6px">'+ic+'</span>'+msg;

      if (type === 'success') {
        form.reset();
        var formChildren = form.children;
        for (var i = 0; i < formChildren.length; i++) {
          if (formChildren[i] !== el) formChildren[i].style.display = 'none';
        }
        form.appendChild(el);
        el.style.cssText += 'padding:32px 24px;font-size:16px;';
      } else {
        var btn = form.querySelector('button[type="submit"],input[type="submit"]');
        if (btn) btn.parentNode.insertBefore(el, btn.nextSibling);
        else form.appendChild(el);
        setTimeout(function(){ if(el.parentElement) el.remove(); }, 8000);
      }
    }

    var _coreNameFields=['name','firstName','first_name','fname','lastName','last_name','lname'];
    var _coreEmailFields=['email','emailAddress','mail','e-mail'];
    var _corePhoneFields=['phone','tel','telephone','mobile','cellphone'];
    var _coreMsgFields=['message','msg','comments','comment','description','details','notes','body','text','inquiry'];
    var _coreSubjectFields=['subject','topic','regarding','re'];
    var _allCoreFields=[].concat(_coreNameFields,_coreEmailFields,_corePhoneFields,_coreMsgFields,_coreSubjectFields);

    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (!form || form.tagName !== 'FORM' || !isContactForm(form)) return;
      e.preventDefault();
      e.stopPropagation();

      var origSubmit = form.submit;
      form.submit = function(){ };

      if (form.__zappySubmitting) return;
      form.__zappySubmitting = true;

      var oldFeedback = form.querySelector('.zappy-form-feedback');
      if (oldFeedback) oldFeedback.remove();

      var btn = form.querySelector('button[type="submit"],input[type="submit"]');
      var origText = btn ? (btn.value || btn.textContent) : '';
      if (btn) {
        if (btn.tagName === 'INPUT') btn.value = 'Sending...';
        else btn.textContent = 'Sending...';
        btn.disabled = true;
      }

      var fd = new FormData(form);
      var data = {};
      for(var pair of fd.entries()){
        if(data[pair[0]]!==undefined){
          if(Array.isArray(data[pair[0]])) data[pair[0]].push(pair[1]);
          else data[pair[0]]=[data[pair[0]],pair[1]];
        } else data[pair[0]]=pair[1];
      }

      var resolvedName=(data.name||'').trim()
        ||[data.firstName||data.first_name||data.fname||'',data.lastName||data.last_name||data.lname||''].filter(Boolean).join(' ').trim()
        ||(data.email||data.emailAddress||data.mail||'').trim()
        ||'Anonymous';
      var resolvedEmail=(data.email||data.emailAddress||data.mail||data['e-mail']||'').trim();
      var resolvedPhone=data.phone||data.tel||data.telephone||data.mobile||data.cellphone||null;
      var resolvedSubject=data.subject||data.topic||data.regarding||data.re||'Contact Form Submission';
      var resolvedMsg=(data.message||data.msg||data.comments||data.comment||data.description||data.details||data.notes||data.body||data.text||data.inquiry||'').trim();
      if(!resolvedMsg){
        var _extra=Object.entries(data).filter(function(e){return _allCoreFields.indexOf(e[0])===-1;});
        if(_extra.length>0) resolvedMsg=_extra.map(function(e){var l=e[0].replace(/([A-Z])/g,' $1').replace(/[_-]/g,' ').trim();var v=Array.isArray(e[1])?e[1].join(', '):e[1];return l+': '+v;}).join('\n');
        else resolvedMsg='Form submission from '+window.location.pathname;
      }

      var extraFields={};
      Object.keys(data).forEach(function(k){if(_allCoreFields.indexOf(k)===-1&&data[k]!==''&&data[k]!=null) extraFields[k]=data[k];});

      var currentPath = window.location.pathname;
      try { var pg=new URLSearchParams(window.location.search).get('page'); if(pg) currentPath=pg; } catch(x){}

      var wid = 'f61e3543-fcb1-4409-8c2d-95c8b4daf287';

      var apiBase = (window.ZAPPY_API_BASE || 'https://api.zappy5.com').replace(/\/$/,'');
      apiBase = apiBase + '/api/email/contact-form';

      var payload={
        websiteId: wid,
        name: resolvedName,
        email: resolvedEmail,
        subject: resolvedSubject,
        message: resolvedMsg,
        phone: resolvedPhone,
        currentPagePath: currentPath
      };
      if(Object.keys(extraFields).length>0) payload.extraFields=extraFields;

      fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(r){ return r.json(); }).then(function(result){
        if (result.success) {
          if (result.thankYouPagePath && result.ticketNumber) {
            window.location.href = result.thankYouPagePath + '?ticket=' + encodeURIComponent(result.ticketNumber);
            return;
          }
          showFormFeedback(form, result.message || 'Thank you! We will get back to you soon.', 'success');
        } else {
          showFormFeedback(form, result.error || 'Failed to send. Please try again.', 'error');
        }
      }).catch(function(){
        showFormFeedback(form, 'Unable to send message right now. Please try again later.', 'error');
      }).finally(function(){
        form.__zappySubmitting = false;
        form.submit = origSubmit;
        if (btn) {
          if (btn.tagName === 'INPUT') btn.value = origText;
          else btn.textContent = origText;
          btn.disabled = false;
        }
      });
    }, true);
  } catch (e) {}
})();
/* END ZAPPY_CONTACT_FORM_PREVENT_DEFAULT */


/* ZAPPY_PUBLISHED_GRID_CENTERING */
(function(){
  try {
    if (window.__zappyGridCenteringInit) return;
    window.__zappyGridCenteringInit = true;

    function centerPartialGridRows() {
      var grids = document.querySelectorAll('[data-zappy-explicit-columns="true"], [data-zappy-auto-grid="true"]');
      for (var g = 0; g < grids.length; g++) {
        try {
          var container = grids[g];
          // Skip if already processed
          if (container.getAttribute('data-zappy-grid-centered') === 'true') continue;

          var items = [];
          for (var c = 0; c < container.children.length; c++) {
            var ch = container.children[c];
            if (!ch || !ch.tagName) continue;
            var tag = ch.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style') continue;
            if (ch.getAttribute('aria-hidden') === 'true') continue;
            if (ch.getAttribute('data-zappy-internal') === 'true') continue;
            var pos = window.getComputedStyle(ch).position;
            if (pos === 'absolute' || pos === 'fixed') continue;
            items.push(ch);
          }
          var totalItems = items.length;
          if (totalItems === 0) continue;

          var cs = window.getComputedStyle(container);
          if (cs.display !== 'grid') continue;
          var gta = (cs.gridTemplateAreas || '').trim();
          if (gta && gta !== 'none') continue;
          var gtc = (cs.gridTemplateColumns || '').trim();
          if (!gtc || gtc === 'none') continue;
          var colWidths = gtc.split(' ').filter(function(v) { return v && parseFloat(v) > 0; });
          var colCount = colWidths.length;
          if (colCount <= 1) continue;

          var itemsInLastRow = totalItems % colCount;
          if (itemsInLastRow === 0) continue;

          var colWidth = parseFloat(colWidths[0]) || 0;
          var gap = parseFloat(cs.columnGap);
          if (isNaN(gap)) gap = parseFloat(cs.gap) || 0;

          var missingCols = colCount - itemsInLastRow;
          var offset = missingCols * (colWidth + gap) / 2;

          // Detect RTL
          var dir = cs.direction || 'ltr';
          var el = container;
          while (el && dir === 'ltr') {
            if (el.getAttribute && el.getAttribute('dir')) { dir = el.getAttribute('dir'); break; }
            if (el.style && el.style.direction) { dir = el.style.direction; break; }
            el = el.parentElement;
          }
          var translateValue = dir === 'rtl' ? -offset : offset;

          // Apply transform to last-row items
          // Temporarily disable CSS transitions to prevent visible animation
          // Preserve any existing transforms (e.g., scale, rotate) by composing
          var startIndex = totalItems - itemsInLastRow;
          var savedTransitions = [];
          for (var i = startIndex; i < totalItems; i++) {
            var item = items[i];
            savedTransitions.push(item.style.transition);
            item.style.transition = 'none';
            var existingTransform = item.style.transform || '';
            var newTransform = existingTransform
              ? existingTransform + ' translateX(' + translateValue + 'px)'
              : 'translateX(' + translateValue + 'px)';
            item.style.transform = newTransform;
          }

          // Force synchronous reflow so the transform is applied instantly
          void container.offsetHeight;

          // Restore original transitions
          for (var j = startIndex; j < totalItems; j++) {
            items[j].style.transition = savedTransitions[j - startIndex];
          }

          // Mark grid as processed so we don't double-apply
          container.setAttribute('data-zappy-grid-centered', 'true');
        } catch(e) {}
      }
    }

    // Run once after DOM is fully loaded (fonts, images, layout complete)
    if (document.readyState === 'complete') {
      centerPartialGridRows();
    } else {
      window.addEventListener('load', centerPartialGridRows);
    }
  } catch(e) {}
})();
