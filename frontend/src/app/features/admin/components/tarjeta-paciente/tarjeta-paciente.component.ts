import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Paciente } from '../../../../core/models/domain.models';
import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector: 'app-tarjeta-paciente', standalone: true, imports: [RouterLink, IconComponent],
  template: `<article class="patient surface"><div class="avatar-large" aria-hidden="true"><span>CP</span></div><div class="patient-copy"><div class="name"><h3>{{paciente.nombre}}</h3><span>{{paciente.edad}} años</span></div><p><strong>Diagnóstico:</strong> {{paciente.diagnosticos.join(', ')}}</p><small>ID del paciente: {{paciente._id.slice(-5)}}</small><div><span class="badge" [class.success]="paciente.activo" [class.muted]="!paciente.activo">{{paciente.activo?'Estable':'Inactivo'}}</span></div></div><a routerLink="/admin/paciente" class="go" aria-label="Ver datos del paciente"><app-icon name="chevron" [size]="20" /></a></article>`,
  styles: [`.patient{min-height:154px;padding:18px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px}.avatar-large{width:70px;height:70px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#e4f3f5,#c6e3e8);border:4px solid white;box-shadow:0 0 0 1px var(--border)}.avatar-large span{font-weight:850;color:var(--primary-dark);font-size:1.15rem}.patient-copy{min-width:0}.name{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.name h3{margin:0;font-size:1.05rem}.name>span{padding:4px 8px;border-radius:7px;background:#edf5fb;color:#52708d;font-size:.68rem;font-weight:750}.patient-copy p{margin:7px 0 4px;color:var(--text-muted);font-size:.76rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.patient-copy p strong{color:var(--text);font-weight:700}.patient-copy small{display:block;color:var(--text-muted);font-size:.68rem;margin-bottom:10px}.go{width:36px;height:50px;display:grid;place-items:center;color:var(--text-muted);border-radius:10px}.go:hover{background:var(--primary-soft);color:var(--primary)}@media(max-width:420px){.patient{grid-template-columns:auto minmax(0,1fr);gap:12px}.avatar-large{width:58px;height:58px}.go{display:none}.patient-copy p{white-space:normal}}`]
})
export class TarjetaPacienteComponent { @Input({ required: true }) paciente!: Paciente; }

