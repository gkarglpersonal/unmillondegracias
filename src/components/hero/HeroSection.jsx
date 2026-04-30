import { copy } from '../../content/copy.js';
import ContributorCounter from './ContributorCounter.jsx';
import HeroProgressBar from './HeroProgressBar.jsx';
import RecentContributionsFeed from './RecentContributionsFeed.jsx';
import HeartIcon from '../ui/HeartIcon.jsx';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  return (
    <header className={styles.hero}>
      <div className={styles.portraitWrap}>
        <img
          src="/images/Mariangeles_Hero.png"
          alt="MªÁngeles"
          className={styles.portraitImg}
        />
      </div>

      <div className={styles.content}>
        <p className={styles.eyebrow}>{copy.hero.eyebrow}</p>

        <h1 className={styles.title}>{copy.hero.title}</h1>

        <p className={styles.subtitle}>{copy.hero.subtitle}</p>

        <ContributorCounter />

        <HeroProgressBar />

        <div className={styles.ctaRow}>
          <a href="#participar" className={`btn ${styles.heroBtn}`}>
            <HeartIcon className={styles.heartIcon} />
            {copy.hero.cta}
          </a>
        </div>

        <RecentContributionsFeed />
      </div>
    </header>
  );
}
