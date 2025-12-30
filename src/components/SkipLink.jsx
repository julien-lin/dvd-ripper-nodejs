/**
 * Skip Link pour l'accessibilité
 * Permet aux utilisateurs de clavier de sauter directement au contenu principal
 */
const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="skip-link"
      onClick={(e) => {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      Aller au contenu principal
    </a>
  );
};

export default SkipLink;

