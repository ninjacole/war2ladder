// ...existing code...
import React from 'react';
import '../styles/layout.css';
import { ComponentToMenuMap } from './ComponentToMenuMap';
import { MENU } from './Menu';
import { MenuNode } from './MenuNode';

interface ILayoutProps {
    children?: React.ReactNode;
}

const Layout = (props: ILayoutProps) => {
    const { children } = props;
    const [selected, setSelected] = React.useState<string>('welcome');

    const Active = ComponentToMenuMap[selected] ?? (() => <div>Not found</div>);

    return <div className="app-layout">
        <aside className="sidebar">
            <a className="logo-link" href="/" aria-label="Go to main page">
                <img src='/static/logo.jpg' alt="War2Ladder" className="logo-img" />
            </a>

            <nav className="menu" aria-label="Main menu">
                {MENU.map(node => (
                    <MenuNode
                        key={node.id}
                        id={node.id}
                        label={node.label}
                        href={node.href}
                        children={node.children}
                        onClick={(id) => setSelected(id)}
                    />
                ))}
            </nav>
        </aside>

        <div className="main-area">
            <header className="banner">
                <div className="banner-content">
                    <h2></h2>
                    <div className="logo">Warcraft 2 Sharkfights!</div>
                </div>
            </header>

            <main className="content">
                <Active />
            </main>
        </div>
    </div>
};

export default Layout;