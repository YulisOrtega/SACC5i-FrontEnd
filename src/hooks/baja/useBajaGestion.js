import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import {
  crearBajaEditable,
  editarBajaEditable,
  eliminarBajaEditable,
  obtenerBajasRegistradas,
  obtenerBajasEditables,
  obtenerCatalogoBajas,
  obtenerDisponiblesBaja,
  registrarBaja
} from '../../services/bajaService';

const DEFAULT_PAGINACION = { total: 0, totalPaginas: 1, pagina: 1 };

const normalizarTexto = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const normalizarMayusculas = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizarCatalogoValor = (value = '') =>
  String(value)
    .replace(/\s+/g, ' ')
    .trim();

const separarNombreYApellidos = (registro = {}) => {
  const nombreOriginal = String(registro?.nombre_elemento || '').trim();
  const apellidoPaternoOriginal = String(registro?.apellido_paterno || '').trim();
  const apellidoMaternoOriginal = String(registro?.apellido_materno || '').trim();

  if (apellidoPaternoOriginal || apellidoMaternoOriginal) {
    return {
      ...registro,
      nombre_elemento: nombreOriginal,
      apellido_paterno: apellidoPaternoOriginal,
      apellido_materno: apellidoMaternoOriginal
    };
  }

  const partes = nombreOriginal.split(/\s+/).filter(Boolean);

  if (partes.length >= 3) {
    return {
      ...registro,
      nombre_elemento: partes.slice(0, -2).join(' '),
      apellido_paterno: partes.at(-2) || '',
      apellido_materno: partes.at(-1) || ''
    };
  }

  if (partes.length === 2) {
    return {
      ...registro,
      nombre_elemento: partes[0],
      apellido_paterno: partes[1],
      apellido_materno: ''
    };
  }

  return {
    ...registro,
    nombre_elemento: nombreOriginal,
    apellido_paterno: '',
    apellido_materno: ''
  };
};

const descargarExcelBajas = async (registros = [], filename = 'Bajas_Registradas.xlsx') => {
  const XLSX = await import('xlsx');

  const filas = registros.map((item, index) => ({
    'No.': index + 1,
    Nombre: item?.nombre_elemento || '---',
    'Apellido paterno': item?.apellido_paterno || '---',
    'Apellido materno': item?.apellido_materno || '---',
    CUIP: item?.cuip || '---',
    Tipo: item?.baja_tipo || '---',
    Motivo: item?.baja_motivo || '---',
    'Fecha baja': item?.baja_fecha || '---',
    Observaciones: item?.observaciones || item?.baja_observaciones || '---',
    Estatus: 'DADO DE BAJA'
  }));

  const worksheet = XLSX.utils.json_to_sheet(filas);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
    { wch: 20 },
    { wch: 24 },
    { wch: 16 },
    { wch: 36 },
    { wch: 14 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bajas');
  XLSX.writeFile(workbook, filename);
};

export const useBajaGestion = ({ analistaId = null, isDireccion = false } = {}) => {
  const { showNotification } = useNotification();

  const [busquedaDisponiblesInput, setBusquedaDisponiblesInput] = useState('');
  const [busquedaDisponibles, setBusquedaDisponibles] = useState('');
  const [paginaDisponibles, setPaginaDisponibles] = useState(1);

  const [busquedaBajasInput, setBusquedaBajasInput] = useState('');
  const [busquedaBajas, setBusquedaBajas] = useState('');
  const [busquedaBajasLocalesInput, setBusquedaBajasLocalesInput] = useState('');
  const [busquedaBajasLocales, setBusquedaBajasLocales] = useState('');
  const [paginaBajas, setPaginaBajas] = useState(1);

  const [loadingDisponibles, setLoadingDisponibles] = useState(false);
  const [loadingBajas, setLoadingBajas] = useState(false);
  const [savingBaja, setSavingBaja] = useState(false);
  const [exportingBajasExcel, setExportingBajasExcel] = useState(false);

  const [disponibles, setDisponibles] = useState([]);
  const [bajasRegistradas, setBajasRegistradas] = useState([]);
  const [bajasLocales, setBajasLocales] = useState([]);
  const [selectedRowsBajas, setSelectedRowsBajas] = useState([]);
  const [paginacionDisponibles, setPaginacionDisponibles] = useState(DEFAULT_PAGINACION);
  const [paginacionBajas, setPaginacionBajas] = useState(DEFAULT_PAGINACION);

  const [catalogoBajas, setCatalogoBajas] = useState({});
  const [tipoQuery, setTipoQuery] = useState('');
  const [motivoQuery, setMotivoQuery] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [numeroOficioMunicipio, setNumeroOficioMunicipio] = useState('');
  const [fechaBaja, setFechaBaja] = useState(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState('');
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  const [openTipos, setOpenTipos] = useState(false);
  const [openMotivos, setOpenMotivos] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mostrarFiltrosDisponibles, setMostrarFiltrosDisponibles] = useState(false);
  const [filtroMunicipioDisponible, setFiltroMunicipioDisponible] = useState('');
  const [filtroCuipDisponible, setFiltroCuipDisponible] = useState('');

  const tipoBoxRef = useRef(null);
  const motivoBoxRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (tipoBoxRef.current && !tipoBoxRef.current.contains(event.target)) {
        setOpenTipos(false);
      }
      if (motivoBoxRef.current && !motivoBoxRef.current.contains(event.target)) {
        setOpenMotivos(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDisponibles(busquedaDisponiblesInput.trim());
      setPaginaDisponibles(1);
    }, 260);

    return () => clearTimeout(timer);
  }, [busquedaDisponiblesInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaBajas(busquedaBajasInput.trim());
      setPaginaBajas(1);
    }, 260);

    return () => clearTimeout(timer);
  }, [busquedaBajasInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaBajasLocales(busquedaBajasLocalesInput.trim());
    }, 260);

    return () => clearTimeout(timer);
  }, [busquedaBajasLocalesInput]);

  useEffect(() => {
    setSelectedRowsBajas([]);
  }, [busquedaBajasLocales]);

  const cargarCatalogo = useCallback(async () => {
    if (isDireccion) {
      setCatalogoBajas({});
      return;
    }

    try {
      const catalogo = await obtenerCatalogoBajas();
      setCatalogoBajas(catalogo);
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo cargar el catalogo de bajas', 'error');
    }
  }, [isDireccion, showNotification]);

  const cargarDisponibles = useCallback(async () => {
    if (isDireccion) {
      setDisponibles([]);
      setPaginacionDisponibles(DEFAULT_PAGINACION);
      return;
    }

    setLoadingDisponibles(true);
    try {
      const params = {
        busqueda: busquedaDisponibles,
        pagina: paginaDisponibles,
        limit: 10
      };

      if (analistaId) {
        params.analista_id = analistaId;
      }

      const { registros, paginacion } = await obtenerDisponiblesBaja(params);
      setDisponibles((registros || []).map(separarNombreYApellidos));
      setPaginacionDisponibles(paginacion);
    } catch (error) {
      setDisponibles([]);
      showNotification(error?.response?.data?.message || 'No se pudo cargar el listado disponible para baja', 'error');
    } finally {
      setLoadingDisponibles(false);
    }
  }, [analistaId, busquedaDisponibles, isDireccion, paginaDisponibles, showNotification]);

  const cargarBajas = useCallback(async () => {
    setLoadingBajas(true);
    try {
      // 1. Preparamos los parámetros base
      const params = {
        busqueda: busquedaBajas,
        pagina: paginaBajas,
        limit: 10
      };

      // 2. Solo lo inyectamos si hay un analista seleccionado en Dirección
      if (analistaId) {
        params.analista_id = analistaId;
      }

      const { registros, paginacion } = await obtenerBajasRegistradas(params);
      setBajasRegistradas((registros || []).map(separarNombreYApellidos));
      setPaginacionBajas(paginacion);
    } catch (error) {
      setBajasRegistradas([]);
      showNotification(error?.response?.data?.message || 'No se pudo cargar el listado de bajas registradas', 'error');
    } finally {
      setLoadingBajas(false);
    }
  }, [analistaId, busquedaBajas, paginaBajas, showNotification]);

  const cargarBajasEditables = useCallback(async () => {
    try {
      const { registros } = await obtenerBajasEditables();
      setBajasLocales((registros || []).map(separarNombreYApellidos));
    } catch (error) {
      setBajasLocales([]);
      showNotification(error?.response?.data?.message || 'No se pudo cargar la tabla editable de exportacion', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    if (isDireccion) return;
    cargarCatalogo();
  }, [cargarCatalogo, isDireccion]);

  useEffect(() => {
    if (isDireccion) return;
    cargarDisponibles();
  }, [cargarDisponibles, isDireccion]);

  useEffect(() => {
    cargarBajas();
  }, [cargarBajas]);

  useEffect(() => {
    cargarBajasEditables();
  }, [cargarBajasEditables]);

  useEffect(() => {
    if (!registroSeleccionado) return;
    const sigueVisible = disponibles.some((item) => item.id === registroSeleccionado.id);
    if (!sigueVisible) {
      setRegistroSeleccionado(null);
    }
  }, [disponibles, registroSeleccionado]);

  const tiposDisponibles = useMemo(() => Object.keys(catalogoBajas || {}), [catalogoBajas]);

  const tiposFiltrados = useMemo(() => {
    const q = tipoQuery.trim().toLowerCase();
    if (!q) return tiposDisponibles.slice(0, 30);
    return tiposDisponibles.filter((tipo) => tipo.toLowerCase().includes(q)).slice(0, 30);
  }, [tipoQuery, tiposDisponibles]);

  const motivosDelTipo = useMemo(() => {
    if (!tipoSeleccionado) return [];
    return catalogoBajas[tipoSeleccionado] || [];
  }, [catalogoBajas, tipoSeleccionado]);

  const motivosFiltrados = useMemo(() => {
    const q = motivoQuery.trim().toLowerCase();
    if (!q) return motivosDelTipo.slice(0, 40);
    return motivosDelTipo.filter((motivo) => motivo.toLowerCase().includes(q)).slice(0, 40);
  }, [motivoQuery, motivosDelTipo]);

  const tipoSinMotivos = Boolean(tipoSeleccionado) && motivosDelTipo.length === 0;

  const seleccionarTipo = useCallback((tipo) => {
    setTipoSeleccionado(tipo);
    setTipoQuery(tipo);
    setOpenTipos(false);
    setMotivoSeleccionado('');
    setMotivoQuery('');

    const motivos = catalogoBajas[tipo] || [];
    if (motivos.length === 0) {
      setMotivoSeleccionado(tipo);
      setMotivoQuery(tipo);
    }
  }, [catalogoBajas]);

  const seleccionarMotivo = useCallback((motivo) => {
    setMotivoSeleccionado(motivo);
    setMotivoQuery(motivo);
    setOpenMotivos(false);
  }, []);

  const actualizarTipoQuery = useCallback((value) => {
    setTipoQuery(value);
    setTipoSeleccionado('');
    setMotivoSeleccionado('');
    setMotivoQuery('');
    setOpenTipos(true);
  }, []);

  const actualizarMotivoQuery = useCallback((value) => {
    setMotivoQuery(value);
    setMotivoSeleccionado('');
    setOpenMotivos(true);
  }, []);

  const formatDate = useCallback((value) => {
    if (!value) return '---';
    const date = new Date(String(value).includes('T') ? value : `${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('es-MX');
  }, []);

  const normalizarBajaEditable = useCallback((registro = {}) => ({
    nombre_elemento: normalizarMayusculas(registro.nombre_elemento || ''),
    apellido_paterno: normalizarMayusculas(registro.apellido_paterno || ''),
    apellido_materno: normalizarMayusculas(registro.apellido_materno || ''),
    municipio_nombre: normalizarMayusculas(registro.municipio_nombre || ''),
    cuip: normalizarMayusculas(registro.cuip || ''),
    numero_oficio_municipio: String(registro.numero_oficio_municipio || registro.numero_oficio || '').trim(),
    baja_tipo: normalizarCatalogoValor(registro.baja_tipo || ''),
    baja_motivo: normalizarCatalogoValor(registro.baja_motivo || ''),
    baja_fecha: String(registro.baja_fecha || '').slice(0, 10),
    observaciones: String(registro.observaciones || registro.baja_observaciones || '').trim()
  }), []);

  const extraerIdEditable = useCallback((rowId) => {
    const match = String(rowId || '').match(/^edb-(\d+)$/);
    return match ? Number(match[1]) : Number(rowId) || 0;
  }, []);

  const agregarBajaLocal = useCallback(async (registro = {}) => {
    const payload = normalizarBajaEditable(registro);

    if (!payload.nombre_elemento || !payload.apellido_paterno || !payload.municipio_nombre || !payload.baja_tipo || !payload.baja_motivo || !payload.baja_fecha) {
      showNotification('Complete nombre, apellido paterno, municipio, tipo, motivo y fecha de baja', 'warning');
      return false;
    }

    try {
      await crearBajaEditable(payload);
      await cargarBajasEditables();
      showNotification('Registro agregado correctamente a la tabla editable', 'success');
      return true;
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo guardar el registro editable', 'error');
      return false;
    }
  }, [cargarBajasEditables, normalizarBajaEditable, showNotification]);

  const editarBajaLocal = useCallback(async (rowId, registro = {}) => {
    const editableId = extraerIdEditable(rowId);
    if (!editableId) {
      showNotification('ID de registro invalido para editar', 'warning');
      return false;
    }

    const payload = normalizarBajaEditable(registro);
    if (!payload.nombre_elemento || !payload.apellido_paterno || !payload.municipio_nombre || !payload.baja_tipo || !payload.baja_motivo || !payload.baja_fecha) {
      showNotification('Complete nombre, apellido paterno, municipio, tipo, motivo y fecha de baja', 'warning');
      return false;
    }

    try {
      await editarBajaEditable(editableId, payload);
      await cargarBajasEditables();
      showNotification('Registro actualizado correctamente', 'success');
      return true;
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo actualizar el registro editable', 'error');
      return false;
    }
  }, [cargarBajasEditables, editarBajaEditable, extraerIdEditable, normalizarBajaEditable, showNotification]);

  const eliminarBajaLocal = useCallback(async (rowId) => {
    const editableId = extraerIdEditable(rowId);
    if (!editableId) {
      showNotification('ID de registro invalido para eliminar', 'warning');
      return false;
    }

    try {
      await eliminarBajaEditable(editableId);
      await cargarBajasEditables();
      setSelectedRowsBajas((prev) => prev.filter((id) => id !== rowId));
      showNotification('Registro eliminado correctamente', 'success');
      return true;
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo eliminar el registro editable', 'error');
      return false;
    }
  }, [cargarBajasEditables, eliminarBajaEditable, extraerIdEditable, showNotification]);

  const limpiarBajasLocales = useCallback(async () => {
    if (bajasLocales.length === 0) {
      showNotification('No hay registros recientes para limpiar', 'info');
      return false;
    }

    try {
      await Promise.all(
        bajasLocales.map((item) => eliminarBajaEditable(item.id))
      );
      setBajasLocales([]);
      setSelectedRowsBajas([]);
      showNotification('Registros editables limpiados', 'success');
      return true;
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudieron limpiar los registros editables', 'error');
      return false;
    }
  }, [bajasLocales, showNotification]);

  const limpiarFormularioBaja = useCallback(() => {
    setTipoQuery('');
    setMotivoQuery('');
    setTipoSeleccionado('');
    setMotivoSeleccionado('');
    setNumeroOficioMunicipio('');
    setObservaciones('');
    setFechaBaja(new Date().toISOString().slice(0, 10));
  }, []);

  const abrirConfirmacionRegistro = useCallback(() => {
    if (!registroSeleccionado) {
      showNotification('Seleccione una persona de la tabla de disponibles', 'warning');
      return;
    }

    if (!tipoSeleccionado || !motivoSeleccionado) {
      showNotification('Debe seleccionar tipo y motivo de baja desde el catalogo', 'warning');
      return;
    }

    setShowConfirmModal(true);
  }, [motivoSeleccionado, registroSeleccionado, showNotification, tipoSeleccionado]);

  const confirmarRegistroBaja = useCallback(async () => {
    setShowConfirmModal(false);
    setSavingBaja(true);
    try {
      await registrarBaja({
        finalizado_id: registroSeleccionado.id,
        tipo_baja: tipoSeleccionado,
        motivo_baja: motivoSeleccionado,
        numero_oficio_municipio: normalizarMayusculas(numeroOficioMunicipio),
        fecha_baja: fechaBaja,
        observaciones
      });

      showNotification('Baja registrada correctamente', 'success');
      limpiarFormularioBaja();
      setRegistroSeleccionado(null);
      await Promise.all([cargarDisponibles(), cargarBajas()]);
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo registrar la baja', 'error');
    } finally {
      setSavingBaja(false);
    }
  }, [
    cargarBajas,
    cargarDisponibles,
    fechaBaja,
    limpiarFormularioBaja,
    motivoSeleccionado,
    numeroOficioMunicipio,
    observaciones,
    registroSeleccionado,
    showNotification,
    tipoSeleccionado
  ]);

  const metricDisponibles = paginacionDisponibles.total || 0;
  const metricBajas = paginacionBajas.total || 0;

  const municipiosDisponibles = useMemo(() => {
    const uniques = new Set((disponibles || []).map((item) => (item.municipio_nombre || '').trim()).filter(Boolean));
    return [...uniques].sort((a, b) => a.localeCompare(b, 'es'));
  }, [disponibles]);

  const disponiblesFiltrados = useMemo(() => {
    let result = [...disponibles];
    if (filtroMunicipioDisponible) {
      result = result.filter((item) => (item.municipio_nombre || '') === filtroMunicipioDisponible);
    }
    if (filtroCuipDisponible === 'con_cuip') {
      result = result.filter((item) => String(item.cuip || '').trim() !== '');
    }
    if (filtroCuipDisponible === 'sin_cuip') {
      result = result.filter((item) => String(item.cuip || '').trim() === '');
    }
    return result;
  }, [disponibles, filtroMunicipioDisponible, filtroCuipDisponible]);

  const bajasLocalesFiltradas = useMemo(() => {
    if (!busquedaBajasLocales) return bajasLocales;
    const query = normalizarTexto(busquedaBajasLocales);
    if (!query) return bajasLocales;

    return bajasLocales.filter((item) => {
      const texto = [
        item.nombre_elemento,
        item.apellido_paterno,
        item.apellido_materno,
        item.municipio_nombre,
        item.numero_oficio_municipio,
        item.numero_oficio,
        item.baja_tipo,
        item.baja_motivo,
        formatDate(item.baja_fecha)
      ].join(' ');

      return normalizarTexto(texto).includes(query);
    });
  }, [bajasLocales, busquedaBajasLocales, formatDate]);

  const bajasTablaEditable = useMemo(() => {
    return bajasLocalesFiltradas.map((item) => ({
      ...item,
      row_id: `edb-${item.id}`,
      es_local: true
    }));
  }, [bajasLocalesFiltradas]);

  const bajasTablaSoloLectura = useMemo(() => {
    return (bajasRegistradas || []).map((item) => ({
      ...item,
      row_id: `srv-${item.id}`,
      es_local: false
    }));
  }, [bajasRegistradas]);

  const bajasTabla = bajasTablaEditable;

  const toggleSelectBaja = useCallback((rowId) => {
    setSelectedRowsBajas((prev) => {
      if (prev.includes(rowId)) {
        return prev.filter((id) => id !== rowId);
      }
      return [...prev, rowId];
    });
  }, []);

  const seleccionarTodoBajas = useCallback(() => {
    const ids = bajasTablaEditable.map((item) => item.row_id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedRowsBajas.includes(id));

    if (allSelected) {
      setSelectedRowsBajas((prev) => prev.filter((id) => !ids.includes(id)));
      return;
    }

    setSelectedRowsBajas((prev) => {
      const set = new Set(prev);
      ids.forEach((id) => set.add(id));
      return [...set];
    });
  }, [bajasTablaEditable, selectedRowsBajas]);

  const allBajasCurrentSelected = useMemo(() => {
    if (!bajasTablaEditable.length) return false;
    return bajasTablaEditable.every((item) => selectedRowsBajas.includes(item.row_id));
  }, [bajasTablaEditable, selectedRowsBajas]);

  const puedeExportarBajasCompleto = bajasTablaEditable.length > 0;
  const puedeExportarBajasSeleccion = selectedRowsBajas.length > 0;

  const exportarBajasExcel = useCallback(async (soloSeleccionados = false) => {
    if (soloSeleccionados && selectedRowsBajas.length === 0) {
      showNotification('Seleccione al menos un registro para exportar', 'warning');
      return;
    }

    if (!soloSeleccionados && bajasTablaEditable.length === 0) {
      showNotification('No hay registros de bajas para exportar', 'warning');
      return;
    }

    const fuente = soloSeleccionados
      ? bajasTablaEditable.filter((item) => selectedRowsBajas.includes(item.row_id))
      : bajasTablaEditable;

    const registros = fuente.map((item) => ({
      ...item,
      baja_fecha: formatDate(item.baja_fecha)
    }));

    const filename = soloSeleccionados
      ? 'Bajas_Registradas_Seleccionados.xlsx'
      : 'Bajas_Registradas_Completo.xlsx';

    setExportingBajasExcel(true);
    try {
      await descargarExcelBajas(registros, filename);
      showNotification(
        soloSeleccionados
          ? 'Excel de bajas seleccionadas generado correctamente'
          : 'Excel completo de bajas generado correctamente',
        'success'
      );
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo exportar el archivo Excel', 'error');
    } finally {
      setExportingBajasExcel(false);
    }
  }, [bajasTablaEditable, formatDate, selectedRowsBajas, showNotification]);

  const exportarBajasSistemaExcel = useCallback(async () => {
    const totalRegistros = Number(
      paginacionBajas?.total ?? bajasTablaSoloLectura?.length ?? 0
    );

    if (totalRegistros <= 0) {
      showNotification('No hay elementos dados de baja para exportar', 'warning');
      return;
    }

    setExportingBajasExcel(true);

    try {
      const { registros } = await obtenerBajasRegistradas({
        busqueda: busquedaBajas,
        pagina: 1,
        analista_id: analistaId,
        limit: totalRegistros
      });

      const registrosExcel = (registros || [])
        .map(separarNombreYApellidos)
        .map((item) => ({
          ...item,
          baja_fecha: formatDate(item.baja_fecha)
        }));

      await descargarExcelBajas(registrosExcel, 'Bajas_Del_Sistema_Completo.xlsx');

      showNotification('Excel de bajas del sistema generado correctamente', 'success');
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo exportar el archivo Excel', 'error');
    } finally {
      setExportingBajasExcel(false);
    }
  }, [
    analistaId,
    bajasTablaSoloLectura,
    busquedaBajas,
    formatDate,
    paginacionBajas,
    showNotification
  ]);

  return {
    busquedaDisponiblesInput,
    setBusquedaDisponiblesInput,
    paginaDisponibles,
    setPaginaDisponibles,
    busquedaBajasInput,
    setBusquedaBajasInput,
    busquedaBajasLocalesInput,
    setBusquedaBajasLocalesInput,
    paginaBajas,
    setPaginaBajas,
    loadingDisponibles,
    loadingBajas,
    savingBaja,
    exportingBajasExcel,
    bajasRegistradas,
    bajasTabla,
    bajasTablaEditable,
    bajasTablaSoloLectura,
    bajasLocales,
    selectedRowsBajas,
    allBajasCurrentSelected,
    puedeExportarBajasCompleto,
    puedeExportarBajasSeleccion,
    paginacionDisponibles,
    paginacionBajas,
    tipoQuery,
    setTipoQuery,
    actualizarTipoQuery,
    motivoQuery,
    setMotivoQuery,
    actualizarMotivoQuery,
    tipoSeleccionado,
    motivoSeleccionado,
    numeroOficioMunicipio,
    setNumeroOficioMunicipio,
    fechaBaja,
    setFechaBaja,
    observaciones,
    setObservaciones,
    registroSeleccionado,
    setRegistroSeleccionado,
    openTipos,
    setOpenTipos,
    openMotivos,
    setOpenMotivos,
    showConfirmModal,
    setShowConfirmModal,
    mostrarFiltrosDisponibles,
    setMostrarFiltrosDisponibles,
    filtroMunicipioDisponible,
    setFiltroMunicipioDisponible,
    filtroCuipDisponible,
    setFiltroCuipDisponible,
    tipoBoxRef,
    motivoBoxRef,
    tiposFiltrados,
    motivosFiltrados,
    tipoSinMotivos,
    metricDisponibles,
    metricBajas,
    municipiosDisponibles,
    disponiblesFiltrados,
    formatDate,
    seleccionarTipo,
    seleccionarMotivo,
    abrirConfirmacionRegistro,
    confirmarRegistroBaja,
    agregarBajaLocal,
    editarBajaLocal,
    eliminarBajaLocal,
    limpiarBajasLocales,
    toggleSelectBaja,
    seleccionarTodoBajas,
    catalogoBajas,
    exportarBajasExcel,
    exportarBajasSistemaExcel
  };
};
