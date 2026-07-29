import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login', standalone: true, imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="login-page">
      <section class="login-story" aria-label="Descripción del sistema">
        <div class="brand"><img src="assets/kairos-logo.svg" alt="KAIRÓS" /></div>
        <div class="story-copy"><span class="eyebrow">Cuidado familiar</span><h1>Todo lo importante de papá, en un solo lugar.</h1><p>Revisa su salud, acompaña su medicación y recibe alertas cuando realmente se necesite.</p></div>
      </section>
      <section class="login-panel">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="mobile-brand brand"><img src="assets/kairos-logo.svg" alt="KAIRÓS" /></div>
          <span class="eyebrow">Bienvenido</span><h2>Inicia sesión</h2><p class="intro">Ingresa para registrar y cuidar a tu familiar.</p>
          @if (error) { <div class="inline-error" role="alert">{{ error }}</div> }
          <div class="form-field"><label for="correo">Correo electrónico</label><input id="correo" class="input" type="email" formControlName="correo" autocomplete="email"><small>Usa el correo que el administrador registró para tu cuenta.</small></div>
          <div class="form-field"><label for="password">Contraseña</label><input id="password" class="input" type="password" formControlName="password" autocomplete="current-password"><small>Clave de demostración: Admin123</small></div>
          <button class="btn btn-primary submit" type="submit" [disabled]="loading">{{ loading ? 'Ingresando…' : 'Ingresar' }}</button>
          <p class="register-link">¿Todavía no administras una cuenta? <a routerLink="/registro">Crear cuenta</a></p>
          <p class="privacy">Información protegida para el círculo familiar autorizado.</p>
        </form>
      </section>
    </main>`,
  styles: [`
    .login-page{min-height:100dvh;display:grid;background:white}.login-story{display:none}.login-panel{display:grid;place-items:center;padding:32px 20px;background:linear-gradient(180deg,#fafdff,#f3f8fb)}form{width:min(100%,420px);padding:28px;background:white;border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow)}.brand{display:flex;align-items:center}.brand img{display:block;width:190px;height:auto}.mobile-brand{margin-bottom:42px}.mobile-brand img{width:170px}h2{margin:0 0 8px;font-size:1.8rem;letter-spacing:-.04em}.intro{color:var(--text-muted);margin-bottom:24px}.form-field{margin-top:18px}.submit{width:100%;margin-top:24px}.register-link{text-align:center;margin:17px 0 0;color:var(--text-muted);font-size:.74rem}.register-link a{color:var(--primary);font-weight:800}.privacy{text-align:center;color:var(--text-muted);font-size:.72rem;margin:13px 0 0;line-height:1.5}
    @media(min-width:900px){.login-page{grid-template-columns:minmax(430px,1.08fr) minmax(420px,.92fr)}.login-story{display:flex;position:relative;overflow:hidden;flex-direction:column;justify-content:space-between;padding:46px clamp(44px,7vw,100px);background:#eaf7f9}.login-story::after{content:'';position:absolute;width:420px;height:420px;border:80px solid rgba(15,143,165,.08);border-radius:50%;right:-130px;bottom:-110px}.story-copy{position:relative;z-index:1;max-width:610px}.story-copy h1{font-size:clamp(2.7rem,4.7vw,4.8rem);line-height:.98;letter-spacing:-.065em;margin:0 0 26px}.story-copy p{font-size:1.08rem;color:#4d6d77;max-width:48ch;line-height:1.7}.story-status{position:relative;z-index:1;width:max-content;display:flex;align-items:center;gap:12px;padding:14px 17px;border:1px solid rgba(255,255,255,.75);border-radius:15px;background:rgba(255,255,255,.58);box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}.story-status small{display:block;margin-top:3px;color:var(--text-muted)}.live-dot{width:10px;height:10px;border-radius:50%;background:var(--success);box-shadow:0 0 0 6px rgba(46,174,115,.12);animation:pulse 2.2s infinite}@keyframes pulse{50%{box-shadow:0 0 0 10px rgba(46,174,115,0)}}.login-panel{padding:48px}form{padding:0;border:0;box-shadow:none}.mobile-brand{display:none}}
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder); private readonly auth = inject(AuthService); private readonly router = inject(Router);
  loading = false; error = '';
  form = this.fb.nonNullable.group({ correo: ['daniel@salud.ec', [Validators.required, Validators.email]], password: ['Admin123', Validators.required] });
  submit() { if (this.form.invalid) { this.form.markAllAsTouched(); return; } const { correo, password } = this.form.getRawValue(); this.loading = true; this.error = ''; this.auth.login(correo, password).pipe(finalize(() => this.loading = false)).subscribe({ next: ({ data }) => this.router.navigateByUrl(this.auth.rutaInicial(data.usuario)), error: (e) => this.error = e.error?.mensaje || 'No pudimos conectar con el servidor.' }); }
}
