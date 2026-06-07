import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

export default function Support() {
    return (
        <Layout title="Support & Sponsorship" description="Support the Strux Framework">
            <header className={clsx('hero', styles.heroBanner)} style={{ minHeight: '40vh', background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1), transparent 60%)' }}>
                <div className="container text--center">
                    <h1 className="hero__title" style={{ fontSize: '3rem' }}>Support <span className={styles.gradientText}>Strux</span></h1>
                    <p className="hero__subtitle" style={{ margin: '1.5rem auto' }}>
                        Strux is an MIT-licensed open source project. Its ongoing development is made possible by the support of our incredible sponsors.
                    </p>
                </div>
            </header>
            <main className="container margin-vert--xl">
                <div className="row">
                    <div className="col col--8 col--offset-2">
                        <div className={styles.featureBox} style={{ padding: '3rem' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Why Sponsor?</h2>
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                                Building and maintaining a robust, enterprise-grade framework takes thousands of hours of dedicated work. By sponsoring Strux, you directly contribute to the sustainability of the project, faster bug fixes, and the development of new features.
                            </p>
                            <div className="margin-vert--lg">
                                <h3>Sponsorship Tiers</h3>
                                <ul style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                                    <li><strong>Bronze ($5/mo)</strong> - A massive thank you and a sponsor badge on GitHub.</li>
                                    <li><strong>Silver ($50/mo)</strong> - Your name/logo on the backers list in our README.</li>
                                    <li><strong>Gold ($250/mo)</strong> - Your company logo featured permanently on our homepage.</li>
                                    <li><strong>Platinum ($1000/mo)</strong> - Direct priority email support from the core team.</li>
                                </ul>
                            </div>
                            <div className="text--center margin-top--xl">
                                <Link className="button button--primary button--lg" href="https://github.com/sponsors/jbstrap">
                                    Become a Sponsor via GitHub
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </Layout>
    );
}
