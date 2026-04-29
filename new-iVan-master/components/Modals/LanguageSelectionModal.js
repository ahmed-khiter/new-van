'use client'
import { Modal } from "react-bootstrap";
import { useState, useEffect } from "react";
import { LOCALE_NAMES } from "@/i18n/routing";
import { LOCALE_FLAGS } from "@/utils/localeFlags";

const getAvailableLanguages = (locationCode) => {
  if (!locationCode) return [];
  
  switch (locationCode) {
    case 'SA':
    case 'AE':
    case 'EG':
      return [
        { code: 'en', name: 'English', nativeName: LOCALE_NAMES['en'] },
        { code: 'ar', name: 'Arabic', nativeName: LOCALE_NAMES['ar'] }
      ];
    case 'MA':
      return [
        { code: 'en', name: 'English', nativeName: LOCALE_NAMES['en'] },
        { code: 'ar', name: 'Arabic', nativeName: LOCALE_NAMES['ar'] },
        { code: 'fr', name: 'French', nativeName: LOCALE_NAMES['fr'] }
      ];
    case 'CY':
      return [
        { code: 'en', name: 'English', nativeName: LOCALE_NAMES['en'] },
        { code: 'el', name: 'Greek', nativeName: LOCALE_NAMES['el'] }
      ];
    default:
      return [
        { code: 'en', name: 'English', nativeName: LOCALE_NAMES['en'] }
      ];
  }
};

export default function LanguageSelectionModal({ isOpen, onLanguageSelect, location }) {
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  useEffect(() => {
    if (isOpen && location?.code) {
      const availableLanguages = getAvailableLanguages(location.code);
      if (availableLanguages.length > 0) {
        const savedLanguage = typeof window !== 'undefined' 
          ? localStorage.getItem('selectedLanguage') 
          : null;
        
        if (savedLanguage && availableLanguages.find(lang => lang.code === savedLanguage)) {
          setSelectedLanguage(savedLanguage);
        } else {
          setSelectedLanguage(availableLanguages[0].code);
        }
      }
    } else {
      setSelectedLanguage(null);
    }
  }, [isOpen, location?.code]);
  
  const availableLanguages = getAvailableLanguages(location?.code);

  const getLanguageFlag = (languageCode) => {
    // If location flag is available and matches the language's country, use location flag
    if (location?.flag) {
      // For Arabic in Arabic-speaking countries, use location flag
      if (languageCode === 'ar' && ['SA', 'AE', 'EG', 'MA'].includes(location?.code)) {
        return location.flag;
      }
      // For Greek in Cyprus, use location flag
      if (languageCode === 'el' && location?.code === 'CY') {
        return location.flag;
      }
      // For English, we can use location flag if it's an English-speaking country
      // Otherwise fall back to default
    }
    // Default to locale flag mapping (French always uses French flag 🇫🇷)
    return LOCALE_FLAGS[languageCode] || '🌐';
  };

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage((prev) => {
      return languageCode;
    });
  };
  
  if (!isOpen || !location?.code) {
    return null;
  }

  const handleContinue = () => {
    if (selectedLanguage) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLanguage', selectedLanguage);
      }
      onLanguageSelect(selectedLanguage);
    }
  };

  if (availableLanguages.length <= 1) {
    return null;
  }

  return (
    <Modal 
      size="md" 
      show={isOpen} 
      onHide={() => {}} 
      centered 
      aria-labelledby="language-selection-modal" 
      className="language-selection-modal p-2" 
      backdrop="static" 
      keyboard={false}
    >
      <div className="p-0">
        <Modal.Body className="p-3">
          <div className="text-center mb-3">
            <div className="d-inline-flex align-items-center justify-content-center mb-2">
              🌐
            </div>
            <h4 id="language-selection-modal" className="fw-bold mb-1">
              Which language do you prefer to continue in?
            </h4>
            {location && (
              <p className="text-muted mb-0 small">
                Selected location: {location.name} {location.flag}
              </p>
            )}
          </div>

          <div className="row">
            {availableLanguages.map((language) => {
              const isSelected = selectedLanguage === language.code;
              return (
                <div key={language.code} className="col-12 mb-2">
                  <div 
                    className="language-card border-1 position-relative overflow-hidden"
                    onClick={() => handleLanguageSelect(language.code)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageSelect(language.code);
                      }
                    }}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '10px',
                      borderColor: isSelected ? '#00403f' : '#dee2e6',
                      borderWidth: isSelected ? '2px' : '1px',
                      backgroundColor: isSelected ? 'rgba(0, 64, 63, 0.1)' : '#ffffff',
                      boxShadow: isSelected ? '0 2px 8px rgba(0, 64, 63, 0.2)' : 'none',
                      marginBottom: '10px',
                      padding: '15px',
                      userSelect: 'none',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <span className="fs-3">{getLanguageFlag(language.code)}</span>
                        <div>
                          <h6 className="mb-0 fw-bold" style={{ color: isSelected ? '#00403f' : '#212529' }}>
                            {language.name}
                          </h6>
                          <p className="mb-0" style={{ fontSize: '0.9rem', color: isSelected ? '#00403f' : '#6c757d' }}>
                            {language.nativeName}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="d-inline-flex align-items-center justify-content-center text-success" style={{ fontSize: '1.5rem' }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <button 
              type="button" 
              className="custom_btn_solid w-100 px-4 py-2" 
              onClick={handleContinue}
              disabled={!selectedLanguage}
              style={{
                opacity: !selectedLanguage ? 0.6 : 1,
                cursor: !selectedLanguage ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="bi bi-check-circle me-2"></i>
              Continue
            </button>
          </div>
        </Modal.Body>
      </div>
    </Modal>
  );
}
