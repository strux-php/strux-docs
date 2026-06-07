import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

const codeSnippet = `<?php

use Strux\\Component\\Attributes\\Route;
use Strux\\Component\\Http\\Response;
use Strux\\Component\\Http\\Controller\\Web\\Controller;

class HomeController extends Controller
{
    #[Route(path: '/', methods: ['GET'], name: 'home')]
    public function index(): Response
    {
        return $this->json([
            'framework' => 'Strux',
            'status'    => 'Blazingly Fast 🚀',
            'message'   => 'Welcome to the future of PHP.'
        ]);
    }
}`;

const ormSnippet = `<?php

use Strux\\Component\\Database\\ORM\\Model;
use Strux\\Component\\Database\\Schema\\Attributes\\Table;

#[Table(name: 'users')]
class User extends Model
{
    #[Column, Id]
    public ?int $id = null;

    #[Column]
    public string $email;
    
    #[OwnsMany(Post::class, 'userId', 'id')]
    public Collection $posts;
}`;

const apiSnippet = `<?php

use Strux\\Component\\Attributes\\ApiRoute;
use Strux\\Component\\Http\\Controller\\Api\\Controller;
use Strux\\Component\\Http\\ApiResponse;

#[ApiController]
#[Prefix('/api/v1')]
#[Produces('application/json')]
#[Consumes('application/json')]
#[Middleware([ApiAuthMiddleware::class])]
class UserController extends Controller
{
    #[ApiRoute('/users/:id', methods: ['GET'])]
    #[ResponseHeader('X-App-Version', '1.5.0')]
    public function show(int $id): ApiResponse
    {
        $user = User::findOrFail($id);
        
        return $this->Ok([
            'data' => $user->toArray()
        ]);
    }
}`;

function HeroSection() {
    return (
        <header className={clsx('hero', styles.heroBanner)}>
            <div className="container">
                <div className="row" style={{ alignItems: 'center' }}>
                    <div className={clsx('col col--6', styles.heroLeft)}>
                        <div className={styles.badge}>v1.0 is here!</div>
                        <h1 className="hero__title">
                            The <span className={styles.gradientText}>Elegant</span> PHP Framework.
                        </h1>
                        <p className="hero__subtitle">
                            Strux is a modern, incredibly fast, attribute-driven framework for web artisans. Build robust, type-safe web applications with absolutely zero boilerplate.
                        </p>
                        <div className={styles.buttons}>
                            <Link
                                className="button button--primary button--lg"
                                to="/docs/intro">
                                Get Started
                            </Link>
                            <Link
                                className="button button--secondary button--lg"
                                to="https://github.com/jbstrap/strux-framework">
                                View Source
                            </Link>
                        </div>
                    </div>
                    <div className={clsx('col col--6', styles.heroRight)}>
                        <div className={styles.codeWindow}>
                            <div className={styles.codeHeader}>
                                <span className={styles.dot} style={{ background: '#ff5f56' }}></span>
                                <span className={styles.dot} style={{ background: '#ffbd2e' }}></span>
                                <span className={styles.dot} style={{ background: '#27c93f' }}></span>
                                <span className={styles.filename}>src/Controllers/HomeController.php</span>
                            </div>
                            <CodeBlock language="php">
                                {codeSnippet}
                            </CodeBlock>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

function ValueProps() {
    const props = [
        {
            title: 'Attribute Driven',
            icon: '✨',
            description: 'Define routes, middleware, validation, and database schemas directly on your classes using modern PHP 8 Attributes. Say goodbye to massive XML/YAML config files.'
        },
        {
            title: 'Zero Configuration',
            icon: '⚡',
            description: 'Intelligent auto-wiring, dependency injection, and registry discovery means the framework stays out of your way. Focus on shipping, not configuring.'
        },
        {
            title: 'Type-Safe Everything',
            icon: '🛡️',
            description: 'From Forms to the Data Mapper to the ORM, Strux is built from the ground up to leverage PHP strict typing, ensuring your code is predictable and completely safe.'
        }
    ];

    return (
        <section className={styles.valueProps}>
            <div className="container">
                <div className="row">
                    {props.map((prop, idx) => (
                        <div key={idx} className="col col--4">
                            <div className={styles.propCard}>
                                <div className={styles.propIcon}>{prop.icon}</div>
                                <h3>{prop.title}</h3>
                                <p>{prop.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FeaturesSection() {
    const features = [
        { title: 'Active Record ORM', desc: 'A beautiful, fluent, attribute-mapped ORM that makes querying your database a joy.' },
        { title: 'Intelligent Data Mapper', desc: 'Automatically hydrate strongly-typed objects from messy HTTP requests without writing assignments.' },
        { title: 'Schema Migrations', desc: 'Strux auto-generates SQL migrations by simply reading your PHP classes. Never write raw SQL again.' },
        { title: 'Robust Queue System', desc: 'Offload heavy tasks to the background with a built-in asynchronous job queue.' },
        { title: 'Powerful DI Container', desc: 'A PSR-11 compliant dependency injection container with automatic interface resolution.' },
        { title: 'Event Dispatcher', desc: 'Build decoupled applications with a robust, PSR-14 compliant event listener system.' },
    ];

    return (
        <section className={styles.featuresSection}>
            <div className="container">
                <h2 className="text--center margin-bottom--xl" style={{ fontSize: '2.5rem', fontWeight: 800 }}>
                    Everything you need to build <span className={styles.gradientText}>incredible</span> applications.
                </h2>

                <div className="row" style={{ alignItems: 'center', marginBottom: '4rem' }}>
                    <div className="col col--5">
                        <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>A truly modern ORM.</h3>
                        <p style={{ fontSize: '1.2rem', color: 'var(--ifm-color-content-secondary)' }}>
                            The Strux ORM is built on top of PHP 8 Attributes. Define your table name, primary keys, columns, and relations right where they belong—on your Entity.
                        </p>
                        <p style={{ fontSize: '1.2rem', color: 'var(--ifm-color-content-secondary)' }}>
                            It automatically handles eager loading, local query scopes, and robust relationship management (OwnsMany, OwnedBy, etc.).
                        </p>
                    </div>
                    <div className="col col--7">
                        <div className={styles.codeWindow}>
                            <div className={styles.codeHeader}>
                                <span className={styles.dot} style={{ background: '#ff5f56' }}></span>
                                <span className={styles.dot} style={{ background: '#ffbd2e' }}></span>
                                <span className={styles.dot} style={{ background: '#27c93f' }}></span>
                                <span className={styles.filename}>src/Entity/User.php</span>
                            </div>
                            <CodeBlock language="php">
                                {ormSnippet}
                            </CodeBlock>
                        </div>
                    </div>
                </div>

                {/* Second Code Showcase - API Ready */}
                <div className="row" style={{ alignItems: 'center', marginBottom: '4rem', flexDirection: 'row-reverse' }}>
                    <div className="col col--5">
                        <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>API-Ready out of the box.</h3>
                        <p style={{ fontSize: '1.2rem', color: 'var(--ifm-color-content-secondary)' }}>
                            Building stateless JSON APIs is a breeze. Use the dedicated <code>ApiController</code> and <code>ApiResponse</code> helpers to standardize your endpoints.
                        </p>
                        <p style={{ fontSize: '1.2rem', color: 'var(--ifm-color-content-secondary)' }}>
                            Strux automatically handles content negotiation, JSON serialization, and proper HTTP status codes.
                        </p>
                    </div>
                    <div className="col col--7">
                        <div className={styles.codeWindow}>
                            <div className={styles.codeHeader}>
                                <span className={styles.dot} style={{ background: '#ff5f56' }}></span>
                                <span className={styles.dot} style={{ background: '#ffbd2e' }}></span>
                                <span className={styles.dot} style={{ background: '#27c93f' }}></span>
                                <span className={styles.filename}>src/Controllers/Api/UserController.php</span>
                            </div>
                            <CodeBlock language="php">
                                {apiSnippet}
                            </CodeBlock>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {features.map((feature, idx) => (
                        <div key={idx} className="col col--4 margin-bottom--lg">
                            <div className={styles.featureBox}>
                                <h4>{feature.title}</h4>
                                <p>{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function BottomCTA() {
    return (
        <section className={styles.bottomCta}>
            <div className="container text--center">
                <h2>Ready to elevate your PHP?</h2>
                <p>Join the future of web development. Install Strux today.</p>
                <div className={styles.buttons} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                    <Link
                        className="button button--primary button--lg"
                        to="/docs/intro">
                        Read the Documentation
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function Home() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={siteConfig.title}
            description="Modern, Attribute-Based PHP Framework">
            <main>
                <HeroSection />
                <ValueProps />
                <FeaturesSection />
                <BottomCTA />
            </main>
        </Layout>
    );
}