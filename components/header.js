import Link from "next/link";
import { Nav, Navbar, NavItem, NavLink } from "reactstrap";
import { useUser } from "../lib/hooks";

const Header = () => {
  const user = useUser();

  return (
    <header>
      <Navbar light expand="xs" className="text-right">
        <Nav navbar className="w-100">
          <NavItem>
            <NavLink href="/map">Карта</NavLink>
          </NavItem>
          {user ? (
            <>
              <NavItem>
                <NavLink href='#'>Настройка взаимодействий(В планах)</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/notifications">Настройка уведомлений</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/zone_names">Названия своих зон</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/api/logout">Выйти</NavLink>
              </NavItem>
            </>
          ) : (
            <NavItem>
              <NavLink href="/login">Войти</NavLink>
            </NavItem>
          )}
        </Nav>
      </Navbar>
    </header>
  );
};

export default Header;
