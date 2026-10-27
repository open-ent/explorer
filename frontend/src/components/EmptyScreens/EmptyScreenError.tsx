import { EmptyScreen } from '@open-ent/react';
import illuError from '@images/emptyscreen/illu-error.svg';
import { useTranslation } from 'react-i18next';

export default function EmptyScreenError(): JSX.Element {
  const { t } = useTranslation();

  return (
    <EmptyScreen
      imageSrc={illuError}
      imageAlt={t('explorer.emptyScreen.error.alt', {
        defaultValue: "Panneau d'erreur",
      })}
      // Le texte était passé tel quel (la clé s'affichait à l'écran). Valeur par défaut : toutes les applications
      // n'ont pas encore la clé dans leur fichier de traductions.
      text={t('explorer.emptyScreen.error.text', {
        defaultValue:
          "Un problème est survenu lors du chargement des ressources. Si le problème persiste, contactez l'assistance.",
      })}
    />
  );
}
