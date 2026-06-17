export function RegisterSidebar() {
  return (
    <div className="hidden lg:flex w-64 flex-shrink-0 relative overflow-hidden bg-zinc-900 rounded-lg">
      <img
        alt="Detalhe de carro de luxo"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlQ-vyYOsFsEefA2Jb7GPUz40wfBxbYw6npBGIcR7oxKrQFUUlMCESEeWrRXSkGJGMysZ9zIi8rTpRPRc4BWWydLpSru9mUo5vvmEKQ70qrf-hfi5K6hUjZxt-EdaUlD3VBbkcJRX5W3co962fopkRG1z2pcLpzaDt9jJQtZJJuilhnfUq4RZS6-0A7Sp7gHz_JAv3D5yfe_Z7F8cYCZu5lA3y613rV27DDOOxjcaWTer-E2tCcNgVgd8yy1_MC0PSeGX9LZmXTOez"
      />
      <div className="relative z-10 p-6 flex flex-col justify-end h-full bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white">
        <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70 font-headline">
          AutoHub
        </p>
        <h2 className="text-xl font-extrabold tracking-tight leading-snug mb-3 font-headline">
          Redefinindo o cuidado automotivo
        </h2>
        <p className="text-xs text-zinc-300 line-clamp-3">
          Oficinas de elite conectadas aos melhores motoristas.
        </p>
      </div>
    </div>
  )
}

export default RegisterSidebar
