import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

export default function Community() {
    return (
        <Layout title="Community" description="Join the Strux Framework Community">
            <header className={clsx('hero', styles.heroBanner)} style={{ minHeight: '40vh', background: 'var(--ifm-background-surface-color)' }}>
                <div className="container text--center">
                    <h1 className="hero__title" style={{ fontSize: '3rem' }}>Join the <span className={styles.gradientText}>Community</span></h1>
                    <p className="hero__subtitle" style={{ margin: '1.5rem auto' }}>
                        Connect with other developers, share your projects, and help us build the future of PHP.
                    </p>
                </div>
            </header>
            <main className="container margin-vert--xl">
                <div className="row">
                    <div className="col col--4 margin-bottom--lg">
                        <div className={styles.featureBox} style={{ textAlign: 'center' }}>
                            <div className={styles.propIcon}>💬</div>
                            <h3>Discord Server</h3>
                            <p>Join our official Discord server to chat with the core team and other developers in real-time.</p>
                            <Link className="button button--secondary" href="https://discord.gg/strux">Join Discord</Link>
                        </div>
                    </div>
                    <div className="col col--4 margin-bottom--lg">
                        <div className={styles.featureBox} style={{ textAlign: 'center' }}>
                            <div className={styles.propIcon}>🐦</div>
                            <h3>Twitter / X</h3>
                            <p>Follow us on X for the latest announcements, tips, and ecosystem updates.</p>
                            <Link className="button button--secondary" href="https://twitter.com/struxphp">Follow @struxphp</Link>
                        </div>
                    </div>
                    <div className="col col--4 margin-bottom--lg">
                        <div className={styles.featureBox} style={{ textAlign: 'center' }}>
                            <div className={styles.propIcon}>🐙</div>
                            <h3>GitHub Discussions</h3>
                            <p>Ask questions, propose new features, and share ideas on our GitHub Discussions board.</p>
                            <Link className="button button--secondary" href="https://github.com/jbstrap/strux-framework/discussions">View Discussions</Link>
                        </div>
                    </div>
                </div>
            </main>
        </Layout>
    );
}
