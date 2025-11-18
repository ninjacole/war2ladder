import { useState } from "react";

export interface IMenuNodeProps {
    id: string;
    label: string;
    href?: string;
    children?: IMenuNodeProps[];
    onClick?: (id: string) => void;
};

export const MenuNode = (props: IMenuNodeProps) => {
    const { id, label, href, children, onClick } = props;
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

    const hasChildren = Array.isArray(children) && children.length > 0;
    const isOpen = !!openMap[id];

    const handleToggle = (id: string) => {
        setOpenMap(prev => ({ ...prev, [id]: !prev[id] }));
        onClick && onClick(id);
    };

    return <div key={id} className="menu-entry">
        {hasChildren ? <>
            <button
                type="button"
                className={`menu-btn ${isOpen ? 'expanded' : ''}`}
                onClick={() => handleToggle(id)}
                aria-expanded={isOpen}
                aria-controls={`submenu-${id}`}
            >
                <span className="menu-label">{label}</span>
                <span className="chev">{isOpen ? '▾' : '▸'}</span>
            </button>

            <div
                id={`submenu-${id}`}
                className={`submenu ${isOpen ? 'open' : ''}`}
                role="group"
                aria-hidden={!isOpen}
                onClick={() => handleToggle(id)}
            >
                {children!.map(child => (
                    <a key={child.id} className="menu-item sub-item" href={child.href || '#'}>
                        {child.label}
                    </a>
                ))}
            </div>
        </>
            :
            <a className="menu-item" href={href || '#'} onClick={() => handleToggle(id)}>
                {label}
            </a>
        }
    </div>
};