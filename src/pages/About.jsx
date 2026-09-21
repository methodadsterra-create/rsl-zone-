import { useLanguage } from '../contexts/LanguageContext';

export default function About() {
  const { t, language } = useLanguage();
  return (
    <div className="container">
      <div className="page-header"><h1>{t('footer.about')}</h1></div>
      <div className="section" style={{ maxWidth: '68ch' }}>
        <p>{t('footer.aboutText')}</p>
        {language === 'en' ? (
          <>
            <p>
              SPL Zone publishes original news coverage, analysis and features about the Saudi Pro League,
              its clubs, players and matches. We are fans and independent journalists, not a rights holder,
              broadcaster or representative of the league or any club.
            </p>
            <p>
              Team crests, competition names and player names are used for editorial identification purposes
              only. Any trademarks referenced remain the property of their respective owners.
            </p>
          </>
        ) : (
          <>
            <p>
              ينشر إس بي إل زون تغطية إخبارية أصلية وتحليلات وتقارير خاصة حول الدوري السعودي للمحترفين
              وأنديته ولاعبيه ومبارياته. نحن مشجعون وصحفيون مستقلون، ولسنا جهة مالكة للحقوق أو جهة بث أو
              ممثلين عن الدوري أو أي ناد.
            </p>
            <p>
              تُستخدم شعارات الأندية وأسماء البطولات واللاعبين لأغراض تحريرية للتعريف فقط، وتبقى أي علامات
              تجارية مذكورة ملكاً لأصحابها.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
