import { useEffect, useState } from "react";

export interface IMenuNodeProps {
    id: string;
    label: string;
    href?: string;
    children?: IMenuNodeProps[];
    onClick?: (id: string) => void;
    selected: string;
};

export const MenuNode: React.FC<IMenuNodeProps> = (props: IMenuNodeProps) => {
    const { id, label, href, children, onClick, selected } = props;
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

    const hasChildren = Array.isArray(children) && children.length > 0;
    const isSelected = selected === id;
    const hasSelectedChild = children?.some(child => child.id === selected);

    const isOpen = isSelected || hasSelectedChild || !!openMap[id];

    const handleToggle = (id: string) => {
        setOpenMap(prev => ({ ...prev, [id]: !prev[id] }));
        onClick && onClick(id);
    };

    useEffect(() => {
        if (isSelected || hasSelectedChild) {
            setOpenMap(prev => ({ ...prev, [id]: !prev[id] }));
        }
    })

    return <div key={id} className="menu-entry ${isSelected ? 'active' : ''}">
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