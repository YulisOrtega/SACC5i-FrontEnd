import { useEffect, useState } from 'react';
import './styles/index.css';
import { MdPersonRemove } from 'react-icons/md';
import { useBajaGestion } from '../../../hooks/baja/useBajaGestion';
import {
  BajaConfirmModal,
  BajaDisponiblesTabSection,
  BajaElementosDadosTabSection,
  BajaManualRegistradasTabSection,
  BajaRegistroTabSection
} from './components';

export default function Baja({ setPageTitle, isDireccion = false, analistaId = null }) {
  const baja = useBajaGestion({ isDireccion, analistaId }); 
  const [tabActiva, setTabActiva] = useState(isDireccion ? 'dadas' : 'disponibles');

  useEffect(() => {
    setTabActiva(isDireccion ? 'dadas' : 'disponibles');
  }, [isDireccion]);

  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: "Baja de Personal",
        subtitulo: "Registro y control de bajas de elementos finalizados",
        icon: <MdPersonRemove className="nav-icon-highlight" />
      });
    }
    return () => {
      if (setPageTitle) setPageTitle(null);
    };
  }, [setPageTitle]);

  return (
    <div className="baja-container">
      {!isDireccion && (
        <div className="baja-tabs" role="tablist" aria-label="Secciones de bajas">
          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === 'disponibles'}
            className={`baja-tab-btn ${tabActiva === 'disponibles' ? 'active' : ''}`}
            onClick={() => setTabActiva('disponibles')}
          >
            1. Disponibles para baja
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === 'registro'}
            className={`baja-tab-btn ${tabActiva === 'registro' ? 'active' : ''}`}
            onClick={() => setTabActiva('registro')}
          >
            2. Registrar baja
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === 'dadas'}
            className={`baja-tab-btn ${tabActiva === 'dadas' ? 'active' : ''}`}
            onClick={() => setTabActiva('dadas')}
          >
            3. Elementos dados de baja
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === 'recientes'}
            className={`baja-tab-btn ${tabActiva === 'recientes' ? 'active' : ''}`}
            onClick={() => setTabActiva('recientes')}
          >
            4. Bajas registradas manualmente
          </button>
        </div>
      )}

      {!isDireccion && tabActiva === 'disponibles' && (
        <BajaDisponiblesTabSection baja={baja} />
      )}

      {!isDireccion && tabActiva === 'registro' && (
        <BajaRegistroTabSection baja={baja} />
      )}

      {(isDireccion || tabActiva === 'dadas') && (
        <BajaElementosDadosTabSection baja={baja} />
      )}

      {!isDireccion && tabActiva === 'recientes' && (
        <BajaManualRegistradasTabSection baja={baja} />
      )}

      {isDireccion && (
        <BajaManualRegistradasTabSection baja={baja} isDireccion={isDireccion} />
      )}

      {!isDireccion && (
        <BajaConfirmModal
          visible={baja.showConfirmModal}
          registroSeleccionado={baja.registroSeleccionado}
          tipoSeleccionado={baja.tipoSeleccionado}
          motivoSeleccionado={baja.motivoSeleccionado}
          numeroOficioMunicipio={baja.numeroOficioMunicipio}
          fechaBaja={baja.fechaBaja}
          formatDate={baja.formatDate}
          savingBaja={baja.savingBaja}
          onCancel={() => baja.setShowConfirmModal(false)}
          onConfirm={baja.confirmarRegistroBaja}
        />
      )}
    </div>
  );
}