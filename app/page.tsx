import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AtelierLogo } from '@/components/icons/Icons';
import { BeakerIcon, SparkleIcon, BoxIcon } from '@/components/icons/Icons';
import styles from './Landing.module.css';

export default async function LandingPage() {
  const session = await auth();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <AtelierLogo />
        </div>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.signInBtn}>Sign in</Link>
          <Link href="/register" className={styles.getStartedBtn}>Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          The composable manufacturing platform for beauty & wellness
        </h1>
        <p className={styles.heroSub}>
          From formulation to fulfillment, Atelier brings your entire product
          innovation pipeline into one intelligent workspace.
        </p>
        <div className={styles.heroCta}>
          <Link href="/register" className={styles.heroPrimary}>Get started free</Link>
          <Link href="/login" className={styles.heroSecondary}>Sign in</Link>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}><BeakerIcon /></div>
          <h3 className={styles.featureTitle}>Formulation catalog</h3>
          <p className={styles.featureDesc}>
            Browse, compare, and manage base formulations across categories.
            Track versions, regulatory markets, and ingredient lists in one place.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}><SparkleIcon /></div>
          <h3 className={styles.featureTitle}>AI-powered innovation</h3>
          <p className={styles.featureDesc}>
            Use Atelier AI to explore product concepts, generate briefs, and
            accelerate your innovation pipeline from idea to sample.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}><BoxIcon /></div>
          <h3 className={styles.featureTitle}>Sample tracking</h3>
          <p className={styles.featureDesc}>
            Order samples, track production stages, and collect team reviews
            — all connected to your formulations and packaging.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        Platform01 &middot; The future of manufacturing
      </footer>
    </div>
  );
}
