import { ROLES, ROLE_LABELS } from '../constants/roles';
import { PERMISSIONS } from '../constants/permissions';

// Configuración de menús por rol, modificar según las secciones 
export const menuConfig = {
  [ROLES.SUPER_ADMIN]: [
    { icon: 'bx-grid-alt', label: 'Dashboard', section: 'Dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-user-circle', label: 'Usuarios', section: 'Usuarios', permission: PERMISSIONS.VIEW_USUARIOS },
    { icon: 'bx-user-plus', label: 'Alta', section: 'Alta', permission: PERMISSIONS.VIEW_ALTA },
    { icon: 'bx-history', label: 'Historial', section: 'HistorialC3', permission: PERMISSIONS.VIEW_HISTORIAL_C3 },
    { icon: 'bx-user-x', label: 'Baja', section: 'Baja', permission: PERMISSIONS.VIEW_BAJA },
    { icon: 'bx-search-alt-2', label: 'Consulta', section: 'Consulta', permission: PERMISSIONS.VIEW_CONSULTA },
    { icon: 'bx-calendar-event', label: 'Citas', section: 'HistorialCitas', permission: PERMISSIONS.VIEW_CITAS },
    { icon: 'bx-badge-check', label: 'Finalizados', section: 'Finalizados', permission: PERMISSIONS.VIEW_FINALIZADOS },
    { icon: 'bx-file', label: 'Copias de Conocimiento', section: 'CopiasConocimiento', permission: PERMISSIONS.VIEW_CCP },
    { icon: 'bx-time', label: 'Historial CCP', section: 'HistorialOperadorCCP', permission: PERMISSIONS.VIEW_HISTORIAL_CCP },
    { icon: 'bx-list-ul', label: 'Listado Nominal', section: 'ListadoNominal', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-archive', label: 'Personal Activo', section: 'RepositorioMunicipios', permission: PERMISSIONS.VIEW_DASHBOARD }
  ],
  
  [ROLES.ADMIN]: [
    { icon: 'bx-grid-alt', label: 'Dashboard', section: 'Dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-user-circle', label: 'Usuarios', section: 'Usuarios', permission: PERMISSIONS.VIEW_USUARIOS },
    { icon: 'bx-user-plus', label: 'Alta', section: 'Alta', permission: PERMISSIONS.VIEW_ALTA },
    { icon: 'bx-history', label: 'Historial', section: 'HistorialC3', permission: PERMISSIONS.VIEW_HISTORIAL_C3 },
    { icon: 'bx-user-x', label: 'Baja', section: 'Baja', permission: PERMISSIONS.VIEW_BAJA },
    { icon: 'bx-search-alt-2', label: 'Consulta', section: 'Consulta', permission: PERMISSIONS.VIEW_CONSULTA },
    { icon: 'bx-calendar-event', label: 'Citas', section: 'HistorialCitas', permission: PERMISSIONS.VIEW_CITAS },
    { icon: 'bx-badge-check', label: 'Finalizados', section: 'Finalizados', permission: PERMISSIONS.VIEW_FINALIZADOS },
    { icon: 'bx-file', label: 'Copias de Conocimiento', section: 'CopiasConocimiento', permission: PERMISSIONS.VIEW_CCP },
    { icon: 'bx-time', label: 'Historial CCP', section: 'HistorialOperadorCCP', permission: PERMISSIONS.VIEW_HISTORIAL_CCP },
    // Ruta de prueba para filtrado por municipio --- IGNORE ---:
    { icon: 'bx-test-tube', label: 'Filtrado Municipio', section: 'TestMunicipio', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-folder-open', label: 'Revisión Municipios', section: 'TestRevisionC5', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-list-ul', label: 'Listado Nominal', section: 'ListadoNominal', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-archive', label: 'Personal Activo', section: 'RepositorioMunicipios', permission: PERMISSIONS.VIEW_DASHBOARD }
  ],

 [ROLES.DIRECCION]: [
    { icon: 'bx-test-tube', label: 'Filtrado Municipio', section: 'TestMunicipio', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-loader-circle', label: 'En Proceso', section: 'EnProceso', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-calendar-event', label: 'Citas', section: 'HistorialCitas', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-user-x', label: 'Bajas', section: 'Baja', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-badge-check', label: 'Finalizados', section: 'Finalizados', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-message-square-x', label: 'Rechazos', section: 'RechazosC3', permission: PERMISSIONS.VIEW_PANEL_DIRECCION }
],

  [ROLES.COORDINADOR]: [
    { icon: 'bx-test-tube', label: 'Filtrado Municipio', section: 'TestMunicipio', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-loader-circle', label: 'En Proceso', section: 'EnProceso', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-calendar-event', label: 'Citas', section: 'HistorialCitas', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-user-x', label: 'Bajas', section: 'Baja', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-badge-check', label: 'Finalizados', section: 'Finalizados', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    { icon: 'bx-message-square-x', label: 'Rechazos', section: 'RechazosC3', permission: PERMISSIONS.VIEW_PANEL_DIRECCION },
    // Ruta de prueba para filtrado por municipio --- IGNORE ---:
    
  ],
  
  [ROLES.ANALISTA]: [
    { icon: 'bx-grid-alt', label: 'Dashboard', section: 'Dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-user-plus', label: 'Alta', section: 'Alta', permission: PERMISSIONS.VIEW_ALTA },
    { icon: 'bx-search-alt-2', label: 'Consulta', section: 'Consulta', permission: PERMISSIONS.VIEW_CONSULTA },
    { icon: 'bx-user-x', label: 'Baja', section: 'Baja', permission: PERMISSIONS.VIEW_BAJA },
    { icon: 'bx-loader-circle', label: 'En Proceso', section: 'EnProceso', permission: PERMISSIONS.VIEW_ALTA },
    // Revisión Requisitos y Validación CUIP son accesibles solo desde la Bandeja Única (EnProceso)
    { icon: 'bx-calendar-event', label: 'Citas', section: 'HistorialCitas', permission: PERMISSIONS.VIEW_CITAS },
    { icon: 'bx-badge-check', label: 'Finalizados', section: 'Finalizados', permission: PERMISSIONS.VIEW_FINALIZADOS },
    { icon: 'bx-message-square-x', label: 'Rechazos', section: 'RechazosC3', permission: PERMISSIONS.VIEW_RECHAZOS_C3 },
    // NUEVO APARTADO PARA EL BUZÓN DE MUNICIPIOS
    { icon: 'bx-folder-open', label: 'Revisión Municipios', section: 'TestRevisionC5', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-list-ul', label: 'Listado Nominal', section: 'ListadoNominal', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-archive', label: 'Personal Activo', section: 'RepositorioMunicipios', permission: PERMISSIONS.VIEW_DASHBOARD }
  ],
  
  [ROLES.VALIDADOR_C3]: [
    { icon: 'bx-grid-alt', label: 'Dashboard', section: 'Dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-check-shield', label: 'Validacion C3', section: 'PersonasPendientesC3', permission: PERMISSIONS.VIEW_PENDIENTES_C3 },
    { icon: 'bx-history', label: 'Historial', section: 'HistorialC3', permission: PERMISSIONS.VIEW_HISTORIAL_C3 }
  ],
  
  [ROLES.DEPENDENCIA]: [
    { icon: 'bx-grid-alt', label: 'Dashboard', section: 'Dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-file-blank', label: 'Mis Trámites', section: 'TramitesDependencia', permission: PERMISSIONS.VIEW_TRAMITES_DEPENDENCIA },
    { icon: 'bx-search-alt-2', label: 'Consulta', section: 'ConsultaDependencia', permission: PERMISSIONS.VIEW_CONSULTA }
  ],

  [ROLES.OPERADOR_CCP]: [
    { icon: 'bx-grid-alt', label: 'Dashboard', section: 'Dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-file', label: 'Cp. Conocimiento', section: 'CopiasConocimiento', permission: PERMISSIONS.VIEW_CCP },
    { icon: 'bx-time', label: 'Historial CCP', section: 'HistorialOperadorCCP', permission: PERMISSIONS.VIEW_HISTORIAL_CCP }
  ],

  // NUEVO ROL: MUNICIPIO
  // Solo ven su dashboard básico (perfil/notificaciones) y la carga de documentos
  [ROLES.MUNICIPIO]: [
    { icon: 'bx-grid-alt', label: 'Dashboard', section: 'Dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: 'bx-upload', label: 'Cargar Documentos', section: 'TestCargaDocumentos', permission: PERMISSIONS.VIEW_DASHBOARD }
  ]
};

export const getRoleDisplayName = (rol) => {
  return ROLE_LABELS[rol] || rol;
};
