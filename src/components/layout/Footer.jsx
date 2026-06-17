export function Footer() {
  return (
    <footer className="w-full py-12 px-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-screen-2xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">Autohub</span>
            <p className="mt-4 text-zinc-500 text-sm leading-relaxed">
              O principal marketplace de excelência automotiva. Conectamos proprietários exigentes com especialistas técnicos de elite.
            </p>
          </div>

          {/* Services Column */}
          <div>
            <h6 className="font-headline font-bold text-xs uppercase tracking-widest text-zinc-400 mb-6">
              Serviços
            </h6>
            <ul className="flex flex-col gap-4 text-zinc-500 text-sm">
              <li>
                <a className="hover:underline decoration-red-600" href="#">
                  Manutenção
                </a>
              </li>
              <li>
                <a className="hover:underline decoration-red-600" href="#">
                  Afinação de Performance
                </a>
              </li>
              <li>
                <a className="hover:underline decoration-red-600" href="#">
                  Detalhamento e Proteção
                </a>
              </li>
              <li>
                <a className="hover:underline decoration-red-600" href="#">
                  Gestão de Frotas
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h6 className="font-headline font-bold text-xs uppercase tracking-widest text-zinc-400 mb-6">
              Empresa
            </h6>
            <ul className="flex flex-col gap-4 text-zinc-500 text-sm">
              <li>
                <a className="hover:underline decoration-red-600" href="#">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a className="hover:underline decoration-red-600" href="#">
                  Portal de Oficinas
                </a>
              </li>
              <li>
                <a className="hover:underline decoration-red-600" href="#">
                  Padrões de Segurança
                </a>
              </li>
              <li>
                <a className="hover:underline decoration-red-600" href="#">
                  Carreiras
                </a>
              </li>
            </ul>
          </div>

          {/* Subscribe Column */}
          <div>
            <h6 className="font-headline font-bold text-xs uppercase tracking-widest text-zinc-400 mb-6">
              Inscrever-se
            </h6>
            <div className="flex flex-col gap-4">
              <p className="text-zinc-500 text-sm">Receba dicas de manutenção de precisão.</p>
              <div className="flex">
                <input
                  className="bg-white dark:bg-zinc-900 border-none rounded-l-lg text-sm w-full focus:ring-1 focus:ring-primary"
                  placeholder="Email address"
                  type="email"
                />
                <button className="bg-primary text-white p-2 rounded-r-lg">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 text-xs">
            © 2026 Autohub Marketplace de Precisão. Todos os direitos reservados.
          </p>
          <div className="flex gap-8 text-zinc-500 text-xs font-headline font-bold uppercase tracking-widest">
            <a className="hover:underline" href="#">
              Privacidade
            </a>
            <a className="hover:underline" href="#">
              Termos
            </a>
            <a className="hover:underline" href="#">
              Mapa do Site
            </a>
            <a className="text-red-600 font-bold" href="#">
              Login de Oficinas
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
