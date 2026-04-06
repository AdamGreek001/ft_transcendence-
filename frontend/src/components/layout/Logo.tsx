import LogoIcon from '../../../public/icons/logo.svg';

export function Logo() {
    return (
        <div className="flex items-center gap-3 px-2">
            <LogoIcon />
            <h1 className="text-xl font-bold tracking-tight text-white">
                NextLink
            </h1>
        </div>
    );
}
