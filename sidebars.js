// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
    tutorialSidebar: [
        {
            type: 'category',
            label: 'Getting Started',
            collapsed: false,
            items: [
                'intro',
                'getting-started/installation',
                'getting-started/configuration',
                'core/lifecycle',
            ],
        },
        {
            type: 'category',
            label: 'Core Concepts',
            collapsed: false,
            items: [
                'core/dependency-injection',
                'core/events',
                'core/registries',
                'core/middleware',
                'core/middleware-advanced',
                'routing/routing',
                'core/controllers',
            ],
        },
        {
            type: 'category',
            label: 'Components',
            collapsed: false,
            items: [
                'forms/forms',
                'validation/validation',
                'core/cache',
                'core/request',
                'core/response',
            ],
        },
        {
            type: 'category',
            label: 'Database & Queue',
            collapsed: false,
            items: [
                {
                    type: 'category',
                    label: 'ORM',
                    items: [
                        'orm/models',
                        'orm/relationships',
                        'orm/query-builder',
                    ],
                },
                'queue/queue',
                'database/migrations',
            ],
        },
    ],
};

module.exports = sidebars;