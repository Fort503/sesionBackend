import React, { useEffect, useState, useRef, useContext, useCallback, useMemo } from 'react';
import { UserContext } from '../../../context/UserContext';
import { useSelector } from 'react-redux';
import { useReactTable, getCoreRowModel, getExpandedRowModel, flexRender } from '@tanstack/react-table';
import { getArchivosPorEvidencia, getTiposArchivo, uploadFile} from "../../../api/subirarchivos";
import { updatePorcentajePerspectiva} from '../../../api/objetivos';
import { updatePorcentajeCriterio} from '../../../api/perspectivas';
import { updatePorcentajeIndicador} from '../../../api/criterios';
import { getUserRolesPermisosFromToken } from '../../../api/user';
import { getUserContentPermissions, getUsersWithPermissionForEvidence} from '../../../api/permisosContenido';
import { getAllActors, createActor, getActorsByEvidence, assignActorToEvidence } from '../../../api/actores';
import { updateEvidencia, deleteEvidencia } from '../../../api/evidencias';
import { searchByScope } from '../../../api/search';
import { getEventosByEvidencia } from '../../../api/eventoAuditoria';
import { filterTreeByModeAndSearch, getNodeDepth  } from '../../../utils/filterTree';
import FilterBar from './Configuraciones/FilterBar';
import LoadingRow from './LoadingRow';
import SubirArchivosComponent from '../Evidencias/SubirArchivos';
import MiniInfoPopup from '../Evidencias/MiniInfoPopup';
import ActorsPopup from '../Evidencias/MiniInfoPopupAcores';
import TablaArchivosPopup from '../Evidencias/TablaArchivosPopup';
import ConfigPanel from './Configuraciones/ConfigPanel';
import PorcentajeModal from "./Modals/ModalPorcentaje"
import useTreeData from '../../../hooks/useTreeData';
import { useMenuPosition } from '../../../hooks/useMenuPosition';
import ObjectiveModal from './Modals/ModalObjetivo';
import PerspectivaModal from './Modals/ModalPerspectiva';
import CriterioModal from './Modals/ModalCriterio';
import IndicadorModal from './Modals/ModalIndicador';
import EvidenciaModal from './Modals/ModalEvidencia';
import AssociateObjetivoModal from './Modals/AssociateObjetivoModal';
import AssociatePerspectivaModal from './Modals/AssociatePerspectivaModal';
import AssociateCriterioModal from './Modals/AssociateCriterioModal';
import AssociateIndicadorModal from './Modals/AssociateIndicadorModal';
import AssociateEvidenciaModal from './Modals/AssociateEvidenciaModal';
import AssignEvidenceModal from './Modals/AssignEvidenceModal';
import '../../../styles/TreeGridStyle.css';
// import '../../../styles/FullPageModal.css'; 
import pdfIcon from "../../../icons/PDF.svg";
import imageIcon from "../../../icons/PNG.svg";
import wordIcon from "../../../icons/WORD.svg";
import excelIcon from "../../../icons/EXCEL.svg";
import pptIcon from "../../../icons/powerpoint.svg";
import fileIcon from "../../../icons/file.svg";
import txtfile from "../../../icons/TXT.svg";

export default function TreeGridComponent({ initialLanzamiento, permSetFromParent }) {
  const [mode, setMode] = useState('all');
  const [searchScope, setSearchScope] = useState('evidencias');
  const [searchTerm, setSearchTerm] = useState('');
  //const [expanded, setExpanded] = useState({}); 
  const [auditCache, setAuditCache] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [archivosPopup, setArchivosPopup] = useState([]);
  const [tokenPerms, setTokenPerms] = useState([]); // permisos extraídos del token / endpoint
  const [mergedPerms, setMergedPerms] = useState([]); // union del contexto + token
  const [openDepth, setOpenDepth] = useState(null);
  const [user, setUser] = useState(null);
  const [assocMode, setAssocMode] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [indicatorForAssign, setIndicatorForAssign] = useState(null);
  const [rowMenuId, setRowMenuId] = useState(null);
  const [persAssocMode, setPersAssocMode] = useState(null);
  const [criAssocMode, setCriAssocMode] = useState(null);
  const [indAssocMode, setIndAssocMode] = useState(null);
  const [eviAssocMode, setEviAssocMode] = useState(null);
  const [percentModal, setPercentModal] = useState(null);
  const [evidenciaIdArchivos, setEvidenciaIdArchivos] = useState(null);
  const [selectedEvidenciaId, setSelectedEvidenciaId] = useState(null);
  const [eviModalId, setEviModalId] = useState(null);
  const menuRef = useRef(null);
  const [showArchivosPopup, setShowArchivosPopup] = useState(false);
  const [showFullPageModal, setShowFullPageModal] = useState(false);
  const [infoPopup, setInfoPopup] = useState({ visible: false, top: 0, left: 0, entries: []});
  const [actorsPopup, setActorsPopup] = useState({ visible: false, top: 0, left: 0, entries: [] });
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [loadingAdjuntos, setLoadingAdjuntos] = useState(false);
  const [modalState, setModalState] = useState({ type: null, visible: false, payload: null });
  const coloresLeyenda = useSelector(state => state.config.coloresLeyenda);
  const containerRef = useRef();
  const { permissions, refreshPermissions } = useContext(UserContext);
  //const can = permiso => permissions.includes(permiso);
  const [usersByEvidence, setUsersByEvidence] = useState({});
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0});
  const calculatedMenuPosition = useMenuPosition(menuRef, rowMenuId, menuPosition);
  const openModal = (type, payload = null) => setModalState({ type, visible: true, payload });
  const closeModal = () => setModalState({ type: null, visible: false, payload: null });
  const {
    selectedLz, setSelectedLz, lanzamientos, treeData, loadingChildren, globalPercent, isLoadingTree,
    loadTreeData, handleToggleRow, setPermSet, updateNodeByRowId, insertChildUnderRowId, findNodeByRowIdRef,
    removeNodeByRowId, getRowIdFromNode, removeNodeByTypeId,
    // nuevos/alias desde el hook
    expanded: hookExpanded = {}, setExpanded: setHookExpanded = () => {},
    // permisos desde el hook
    permSet, permLoaded
  } = useTreeData();

  const [expanded, setExpanded] = useState(() => (hookExpanded || {}));
  const _same = (a, b) => {
    try { return JSON.stringify(a || {}) === JSON.stringify(b || {}); } catch { return false; }
  };
  const treeDataRef = useRef(treeData);
    useEffect(() => {
    if (!_same(hookExpanded, expanded)) {
      setExpanded(hookExpanded || {});
    }
  }, [hookExpanded]);
  useEffect(() => {
    if (!_same(hookExpanded, expanded)) {
      try { setHookExpanded(expanded); } catch(e) { /* ignore */ }
    }
  }, [expanded]);
  const onExpandButtonClick = (e, row) => {
    e.stopPropagation();
    const rowId = row.id;

    setExpanded(prev => {
      const next = { ...(prev || {}) };
      const wasExpanded = !!next[rowId];
      if (wasExpanded) delete next[rowId];
      else next[rowId] = true;

      // actualizar persistencia (hook)
      setHookExpanded(hPrev => {
        const hn = { ...(hPrev || {}) };
        if (wasExpanded) delete hn[rowId];
        else hn[rowId] = true;
        return hn;
      });

      // Si acabamos de expandir: disparar carga en background (no await)
      const becomingExpanded = !wasExpanded;
      if (becomingExpanded) {
        const node = findNodeByRowIdRef(rowId);
        if (node && node._hasChildren && !node._childrenLoaded) {
          // fire-and-forget: el hook controlará si ya hay carga en progreso
          (async () => {
            try {
              await handleToggleRow(rowId); // handleToggleRow está estabilizado en el hook
            } catch (err) {
              console.error('Error cargando children on expand click:', rowId, err);
            }
          })();
        }
      }

      return next;
    });
  };
  useEffect(() => { treeDataRef.current = treeData; }, [treeData])
  const fetchAuditFor = useCallback(async (idEvidencia) => {
    if (!idEvidencia) return;
    // si ya está en cache (incluso error), no volver a pedir
    if (auditCache[idEvidencia]) return;
    // marcar loading
    setAuditCache(prev => ({ ...prev, [idEvidencia]: { loading: true, data: null, error: null } }));
    try {
      const eventos = await getEventosByEvidencia(idEvidencia);
      const latest = (Array.isArray(eventos) && eventos.length) ? eventos[0] : null;
      setAuditCache(prev => ({ ...prev, [idEvidencia]: { loading: false, data: latest, error: null } }));
    } catch (err) {
      setAuditCache(prev => ({ ...prev, [idEvidencia]: { loading: false, data: null, error: err.message || 'Error' } }));
    }
  }, [auditCache, setAuditCache]);
  const performSearch = async (term) => {
    if (!selectedLz) {
      //console.warn('Selecciona un lanzamiento antes de buscar');
      return;
    }
    if (!searchScope) {
      //console.warn('Selecciona scope de búsqueda');
      return;
    }
    // Usamos el término pasado como argumento, que es el valor en tiempo real del input
    if (!term || term.trim().length < 1) {
      //console.warn('Escribe un término de búsqueda');
      return;
    }

    try {
      setIsSearching(true);
      // llamada al backend
      const results = await searchByScope({
        lanzamiento: selectedLz.id_lanzamiento ?? selectedLz.id,
        scope: searchScope,
        term: term.trim()
      });
      //console.debug('search results', results);
      // integrar resultados en el árbol sin recargar todo
      await handleSearchResults(results || []);
    } catch (err) {
      console.error('Error en búsqueda:', err);
    } finally {
      setIsSearching(false);
    }
  };
  useEffect(() => {
    // Si el término de búsqueda se borra por completo,
    // reseteamos el árbol a su estado original.
    if (searchTerm.trim() === '') {
      setExpanded({});
      loadTreeData();
    }
    // No queremos que el filtrado se ejecute en cada tecleo, solo al limpiar.
  }, [searchTerm]);
  // Busca de forma segura un nodo por rowId dentro del árbol actual
  function findNodeByRowId(nodes, rowId) {
    if (!Array.isArray(nodes)) return null;
    for (const n of nodes) {
      const id = getRowIdFromNode(n);
      if (id === rowId) return n;
      if (n.subRows && n.subRows.length) {
        const found = findNodeByRowId(n.subRows, rowId);
        if (found) return found;
      }
    }
    return null;
  }

  function findNodeByEvidenciaId(nodes, idEvidencia) {
    if (!Array.isArray(nodes)) return null;
    for (const n of nodes) {
      if (Number(n.id_evidencia ?? n.id) === Number(idEvidencia)) return n;
      if (n.subRows && n.subRows.length) {
        const found = findNodeByEvidenciaId(n.subRows, idEvidencia);
        if (found) return found;
      }
    }
    return null;
  }
  function findNodeByEvidenciaIdRef(idEvidencia) {
    return findNodeByEvidenciaId(treeDataRef.current || [], idEvidencia);
  }
  // Asegura la ruta padre hasta el nodo result.
  // Mantiene lazy load: si el padre no cargó children, fuerza handleToggleRow(parentRowLike)
  // para que useTreeData obtenga los hijos reales del servidor antes de insertar.
  async function ensurePathAndInsert(result) {
    const lzId = selectedLz?.id_lanzamiento ?? selectedLz?.id;
    if (!lzId) return;

    const id_objetivo    = result.id_objetivo    ?? result.idObjetivo    ?? result.id;
    const id_perspectiva = result.id_perspectiva ?? result.idPerspectiva ?? result.id_perspectiva;
    const id_criterio    = result.id_criterio    ?? result.idCriterio    ?? result.id_criterio;
    const id_indicador   = result.id_indicador   ?? result.idIndicador   ?? result.id_indicador;
    const id_evidencia   = result.id_evidencia   ?? result.idEvidencia   ?? result.id_evidencia;

    const rootParentId = `${lzId}-0-0-0-0-0`;

    // helper que fuerza carga de children en el parent usando el REF
    async function ensureChildrenLoaded(parentRowId) {
      const parentNode = findNodeByRowIdRef(parentRowId);
      if (!parentNode) return;
      if (!parentNode._childrenLoaded) {
        // llamar handleToggleRow con un objeto con la forma que espera
        await handleToggleRow({ id: parentRowId, original: parentNode });
        // después de await, re-leer parentNode desde ref (porque handleToggleRow actualiza el tree)
        // no devolvemos valor aquí; caller releerá si necesita
      }
    }

    // 1) Objetivo 
    if (id_objetivo) {
      const objRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo });
      const objNode = findNodeByRowIdRef(objRowId);
      if (!objNode) {
        insertChildUnderRowId(rootParentId, {
          id_objetivo,
          nombre: result.nombre ?? result.descripcion ?? `Objetivo ${id_objetivo}`,
          descripcion: result.descripcion ?? '',
          id_lanzamiento: lzId,
          porcentaje: result.porcentaje ?? 0,
          valor: result.valor ?? 0,
          subRows: []
        });
      }
    }

    // 2) Perspectiva
    if (id_perspectiva && id_objetivo) {
      const parentRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo });
      // asegurar que hijos del parent estén cargados
      await ensureChildrenLoaded(parentRowId);
      const persRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo, id_perspectiva });
      const persNode = findNodeByRowIdRef(persRowId);
      if (!persNode) {
        insertChildUnderRowId(parentRowId, {
          id_perspectiva,
          nombre: result.nombre ?? result.descripcion ?? `Perspectiva ${id_perspectiva}`,
          descripcion: result.descripcion ?? '',
          id_objetivo,
          id_lanzamiento: lzId,
          subRows: []
        }, { addToStart: false });
      }
      setExpanded(prev => ({ ...prev, [parentRowId]: true }));
    }

    // 3) Criterio
    if (id_criterio && id_perspectiva && id_objetivo) {
      const parentRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo, id_perspectiva });
      await ensureChildrenLoaded(parentRowId);
      const criRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo, id_perspectiva, id_criterio });
      const criNode = findNodeByRowIdRef(criRowId);
      if (!criNode) {
        insertChildUnderRowId(parentRowId, {
          id_criterio,
          nombre: result.nombre ?? result.descripcion ?? `Criterio ${id_criterio}`,
          descripcion: result.descripcion ?? '',
          id_perspectiva, id_objetivo, id_lanzamiento: lzId, subRows: []
        }, { addToStart: false });
      }
      setExpanded(prev => ({ ...prev, [parentRowId]: true }));
    }

    // 4) Indicador
    if (id_indicador && id_criterio && id_perspectiva && id_objetivo) {
      const parentRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo, id_perspectiva, id_criterio });
      await ensureChildrenLoaded(parentRowId);
      const indRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo, id_perspectiva, id_criterio, id_indicador });
      const indNode = findNodeByRowIdRef(indRowId);
      if (!indNode) {
        insertChildUnderRowId(parentRowId, {
          id_indicador,
          nombre: result.nombre ?? result.descripcion ?? `Indicador ${id_indicador}`,
          descripcion: result.descripcion ?? '',
          id_criterio, id_perspectiva, id_objetivo, id_lanzamiento: lzId, subRows: []
        }, { addToStart: false });
      }
      setExpanded(prev => ({ ...prev, [parentRowId]: true }));
    }

    // 5) Evidencia
    if (id_evidencia && id_indicador && id_criterio && id_perspectiva && id_objetivo) {
      const parentRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo, id_perspectiva, id_criterio, id_indicador });
      await ensureChildrenLoaded(parentRowId);
      const eviRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo, id_perspectiva, id_criterio, id_indicador, id_evidencia });
      const eviNode = findNodeByRowIdRef(eviRowId);
      if (!eviNode) {
        insertChildUnderRowId(parentRowId, {
          id_evidencia,
          nombre: result.nombre ?? result.descripcion ?? `Evidencia ${id_evidencia}`,
          descripcion: result.descripcion ?? '',
          id_indicador, id_criterio, id_perspectiva, id_objetivo, id_lanzamiento: lzId
        }, { addToStart: false });
      }
      setExpanded(prev => ({ ...prev, [parentRowId]: true }));
    }

    // finalmente actualizar el nodo final (merge) — usamos updateNodeByRowId
    const finalRowId = getRowIdFromNode({
      id_lanzamiento: lzId,
      id_objetivo, id_perspectiva, id_criterio, id_indicador, id_evidencia
    });
    updateNodeByRowId(finalRowId, n => ({ ...n, ...result }));
  }

  // Maneja lote de resultados
  async function handleSearchResults(results) {
    if (!Array.isArray(results) || results.length === 0) {
      //console.debug('No results from search');
      return;
    }

    for (const r of results) {
      try {
        await ensurePathAndInsert(r);
      } catch (err) {
        console.error('Error asegurando ruta/insert:', err);
      }
    }
    // ya se insertó/actualizó el árbol; no recargamos todo
  }
  const handleCloseFullPageModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowFullPageModal(false);
      setIsClosingModal(false);
      setSelectedEvidenciaId(null);
    }, 300); // Duración de la animación
  };
  const handleClose = () => {
      setRowMenuId(null);
  };

  const handleClickOutside = e => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target) &&
      !e.target.closest('.menu-cell')
    ) {
      handleClose();
    }
  };
  const computeLocalRec = useCallback((nodes) => {
    if (!Array.isArray(nodes)) return [];
    function recur(arr) {
      return arr.map(n => {
        const node = { ...n };
        if (!node.subRows || node.subRows.length === 0) {
          node.valorLocal = Number(node.valor) || 0;
          return node;
        }
        const hijos = recur(node.subRows);
        const totalPeso = hijos.reduce((s, c) => s + (Number(c.porcentaje) || 0), 0);
        const totalPond = hijos.reduce((s, c) => {
          const peso = Number(c.porcentaje) || 0;
          const v = (typeof c.valorLocal !== 'undefined') ? Number(c.valorLocal) : (Number(c.valor) || 0);
          return s + (peso * v);
        }, 0);
        const valorLocal = totalPeso === 0 ? (Number(node.valor) || 0) : (totalPond / totalPeso);
        node.subRows = hijos;
        node.valorLocal = valorLocal;
        return node;
      });
    }
    return recur(nodes);
  }, []);
  const filteredTree = useMemo(() => {
    return filterTreeByModeAndSearch(treeData, mode, searchScope, searchTerm || '');
  }, [treeData, mode, searchScope, searchTerm]);

const visibleData = useMemo(() => {
  console.debug('[TreeGrid] permLoaded=', !!permLoaded, 'permSet_size=', (permSet && permSet.size) || 0,
                'filteredTree_len=', (Array.isArray(filteredTree) ? filteredTree.length : 0));
  if (permSet instanceof Set && permSet.size > 0) {
    const sample = Array.from(permSet).slice(0,10);
    console.debug('[TreeGrid] sample perm keys:', sample);
  }

  if (!permLoaded) return computeLocalRec(filteredTree);

  if (!permSet || (permSet instanceof Set && permSet.size === 0)) {
    return computeLocalRec(filteredTree);
  }

  const permArray = Array.from(permSet);

  const buildKey = (node) => {
    const lz  = node.id_lanzamiento ?? node.lanzamiento_id ?? node.lanzamientoId ?? 0;
    const obj = node.id_objetivo    ?? node.idObjetivo    ?? node.objetivo_id ?? 0;
    const cri = node.id_criterio    ?? node.idCriterio    ?? node.criterio_id  ?? 0;
    const pers= node.id_perspectiva ?? node.idPerspectiva ?? node.perspectiva_id?? 0;
    const ind = node.id_indicador   ?? node.idIndicador   ?? node.indicador_id ?? 0;
    const evi = node.id_evidencia   ?? node.idEvidencia   ?? node.evidencia_id ?? 0;
    return [lz||0, obj||0, cri||0, pers||0, ind||0, evi||0].join('-');
  };

  const nodeAllowed = (node) => {
    try {
      const nodeKey = buildKey(node);
      if (permSet.has(nodeKey)) return true;

      const nodeParts = nodeKey.split('-').map(s => Number(s || 0));

      const hasMeaningful = nodeParts.some(p => p !== 0);
      if (!hasMeaningful) return false;

      for (const pk of permArray) {
        const pparts = pk.split('-').map(s => Number(s || 0));
        let ok = true;
        for (let i = 0; i < nodeParts.length; i++) {
          if (nodeParts[i] === 0) continue;       
          if (pparts[i] !== nodeParts[i]) { ok = false; break; }
        }
        if (ok) return true; 
      }
      return false;
    } catch (e) {
      console.error('[TreeGrid] nodeAllowed error', e);
      return false;
    }
  };

  const filterByPermsRec = (nodes) => {
    if (!Array.isArray(nodes)) return [];
    const out = [];
    for (const n of nodes) {
      const cloned = { ...n };
      cloned.subRows = filterByPermsRec(n.subRows || []);
      if (nodeAllowed(cloned) || (Array.isArray(cloned.subRows) && cloned.subRows.length > 0)) {
        out.push(cloned);
      }
    }
    return out;
  };

  const reduced = filterByPermsRec(filteredTree);

  console.debug('[TreeGrid] reduced top-level count =', (Array.isArray(reduced) ? reduced.length : 0));

  return computeLocalRec(reduced);
}, [filteredTree, computeLocalRec, permSet, permLoaded]);


  const openVerAdjuntos = async (evidencia) => {
      setLoadingAdjuntos(true);
      try {
        const datos = await getArchivosPorEvidencia(evidencia.id_evidencia);
        setArchivosPopup(datos);
        setEvidenciaIdArchivos(evidencia.id_evidencia);
        setShowArchivosPopup(true);
      } finally {
        setLoadingAdjuntos(false);
      }
  };
  const formatDateTime = (fechaString) => {
    if (!fechaString) return 'Fecha no disponible';
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleString('es-ES', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Fecha inválida'; }
  };

  const extractUploaderFromRecord = (rec) => {
    // Normaliza varias formas que puede traer el backend dependiendo de camibo futuros para usuario
    if (!rec) return null;
    if (rec.usuarioSubio && (rec.usuarioSubio.nombres || rec.usuarioSubio.name)) {
      const n = rec.usuarioSubio;
      return `${n.nombres ?? n.name ?? ''} ${n.apellidos ?? n.surname ?? ''}`.trim();
    }
    if (rec.evidencia && rec.evidencia.usuario) {
      const u = rec.evidencia.usuario;
      return `${u.nombres ?? u.name ?? ''} ${u.apellidos ?? u.apellidos ?? ''}`.trim();
    }
    if (rec.nombres || rec.apellidos) return `${rec.nombres ?? ''} ${rec.apellidos ?? ''}`.trim();
    if (rec.usuario) return rec.usuario;
    if (rec.usuario_subio) return rec.usuario_subio;
    if (rec.uploader) return rec.uploader;
    return null;
  };
  const openActorsPopup = async (evidencia, anchorEl) => {
    if (!evidencia) return;

    const rect = anchorEl.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    const left = rect.left + window.scrollX;

    let entries = [];
    try {
      const eId = String(evidencia.id_evidencia ?? evidencia.id ?? '');
      if (eId) {
        const resp = await getActorsByEvidence(eId);

        const users = Array.isArray(resp) ? resp : (resp?.data ?? []);
        entries = users.map(u => {
          const display = (u.nombres || u.nombre || u.nombre_completo)
            ? `${u.nombres ?? u.nombre ?? u.nombre_completo} ${u.apellidos ?? ''}`.trim()
            : (u.correo ?? u.email ?? `Usuario #${u.id_usuario ?? u.id ?? '?'}`);
          return { display };
        });
      }
    } catch (err) {
      console.error("Error cargando actores:", err);
    }

    if (entries.length === 0) {
      entries = [{ display: "Sin actores asignados" }];
    }

    setActorsPopup({ visible: true, top, left, entries });
  };

  const closeActorsPopup = () => {
    setActorsPopup({ visible: false, top: 0, left: 0, entries: [] });
  };
  const openInfoPopup = async (evidencia, anchorEl) => {
    if (!evidencia) return;
    const rect = anchorEl.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    const left = rect.left + window.scrollX;

    let entries = [];

    // 1) Si la propia evidencia ya trae archivos (campo posible)
    if (Array.isArray(evidencia.archivos) && evidencia.archivos.length > 0) {
      entries = evidencia.archivos.map(a => ({
        uploader: extractUploaderFromRecord(a) || 'Usuario desconocido',
        date: formatDateTime(a.fecha_subida ?? a.createdAt ?? a.created_at ?? a.fecha)
      }));
    }

    // 2) Siempre intentar obtener desde API (fallback/complete history)
    try {
      const id = evidencia.id_evidencia ?? evidencia.id;
      if (id) {
        const archivos = await getArchivosPorEvidencia(id);

        // DEBUG: ver qué devuelve la API
        //console.debug('openInfoPopup - archivos API for', id, archivos);

        if (Array.isArray(archivos) && archivos.length > 0) {
          const fromApi = archivos.map(a => ({
            uploader: extractUploaderFromRecord(a) || 'Usuario desconocido',
            date: formatDateTime(a.fecha_subida ?? a.createdAt ?? a.created_at ?? a.fecha)
          }));
          // concatenamos para incluir TODO el historial (puede haber duplicados pero mantenemos)
          entries = entries.concat(fromApi);
        }
      }
    } catch (err) {
      console.error('Error fetching archivos for mini popup', err);
    }

    // 3) si aún vacío, usar fallback con datos de la evidencia
    if (entries.length === 0) {
      const uploader = extractUploaderFromRecord(evidencia) || 'Usuario desconocido';
      const fecha = evidencia.fecha_subida ?? evidencia.fechaSubida ?? evidencia.createdAt ?? evidencia.created_at ?? evidencia.fecha ?? null;
      entries = [{ uploader, date: formatDateTime(fecha) }];
    }

    // 4) ordenar por fecha descendente si las fechas son válidas (si no, no cambia)
    entries.sort((a, b) => {
      const ta = Date.parse(a.date) || 0;
      const tb = Date.parse(b.date) || 0;
      return tb - ta;
    });

    setInfoPopup({ visible: true, top, left, entries });
  };

  const closeInfoPopup = () => {
    setInfoPopup({ visible: false, top: 0, left: 0, entries: [] });
  };

    useEffect(() => {
      refreshPermissions();
  }, []);
  useEffect(() => {
      if (assocMode !== 'menu') return;
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setAssocMode(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [assocMode]);
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tokenResp = await getUserRolesPermisosFromToken();

        const usuario = tokenResp?.usuario ?? tokenResp?.user ?? tokenResp ?? null;
        if (mounted && usuario) setUser(usuario);

        // Helper para normalizar permisos a strings
        const normalizePerm = p => {
          if (!p) return null;
          if (typeof p === 'string') return p;
          if (typeof p === 'object') return p.nombre ?? p.name ?? p.permission ?? null;
          return String(p);
        };

        const collected = [];

        // varios posibles campos donde pueden venir permisos directos
        const maybeArrays = [
          tokenResp?.permisosDirectos, tokenResp?.permisos, tokenResp?.permissions,
          usuario?.permisosDirectos, usuario?.permisos, usuario?.permissions
        ];
        maybeArrays.forEach(arr => {
          if (Array.isArray(arr)) {
            arr.forEach(x => {
              const n = normalizePerm(x);
              if (n) collected.push(n);
            });
          }
        });

        // permisos que vienen dentro de roles en el token
        const rolesFromToken = tokenResp?.roles ?? usuario?.roles ?? [];
        if (Array.isArray(rolesFromToken)) {
          rolesFromToken.forEach(r => {
            const perms = r?.permisos ?? r?.permissions ?? [];
            if (Array.isArray(perms)) {
              perms.forEach(p => {
                const n = normalizePerm(p);
                if (n) collected.push(n);
              });
            }
          });
        }

        const uniq = Array.from(new Set(collected.filter(Boolean)));
        if (mounted) setTokenPerms(uniq);
      } catch (err) {
        console.error('Error leyendo permisos desde token:', err);
        if (mounted) setTokenPerms([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Unir permisos del contexto + permisos del token
  useEffect(() => {
    const a = Array.isArray(permissions) ? permissions.filter(Boolean) : [];
    const b = Array.isArray(tokenPerms) ? tokenPerms.filter(Boolean) : [];
    const merged = Array.from(new Set([...a, ...b]));
    setMergedPerms(merged);
    }, [permissions, tokenPerms]);
    const can = permisoNombre => {
    if (!permisoNombre) return false;
    return mergedPerms.includes(permisoNombre);
  };
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    (async () => {
      try {
        const permisosUsuarioData = await getUserContentPermissions(user.id); // reemplaza por tu función real
        const arr = Array.isArray(permisosUsuarioData) ? permisosUsuarioData : (permisosUsuarioData?.data ?? []);
        const set = new Set(arr.map(p => [
          p.id_lanzamiento || 0,
          p.id_objetivo    || 0,
          p.id_criterio    || 0,
          p.id_perspectiva || 0,
          p.id_indicador   || 0,
          p.id_evidencia   || 0
        ].join('-')));
        if (mounted) {
          setPermSet(set);
        }
      } catch (err) {
        console.error('Error cargando permisos de contenido:', err);
        if (mounted) setPermSet(new Set()); // fallback: no filtrar
      }
    })();
    return () => { mounted = false; };
  }, [user, setPermSet]);

  useEffect(() => {
    if (rowMenuId === null) return;
    // Fredy probando cosas, comenta en caso de que no funcione akjlsa
    /*
    const onClickOutside = e => {
      if (
        e.target.closest('.row-action-menu') ||
        e.target.closest('.row-menu-icon') || e.target.closest('.bx bx-dots-vertical-rounded')
      ) {
        return;
      }
      setRowMenuId(null);
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
    */
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [rowMenuId]);
  
  const hasGlobalObjectivePerms = can('crear') || can('asociaciones');
  
  function contrasteColorTexto(hexColor) {
    if (!hexColor || hexColor.length < 4) {
      return '#000000'; // Color por defecto
    }

    // Convertir a RGB para poder identificr el brillo
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Formula para calcular la luminosidad percibida 
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // 128 es el punto de quiebre entre un color claro y oscuro
    return brightness >= 128 ? '#000000' : '#FFFFFF';
  }
  
  useEffect(() => {
    
    Object.entries(coloresLeyenda).forEach(([depthClass, color]) => {
      
      // Colores de fondo de las filas
      document.documentElement.style.setProperty(
        `--color-${depthClass}`,
        color
      );

      // Colores de texto de las filas
      const textColor = contrasteColorTexto(color);
      document.documentElement.style.setProperty(
        `--color-text-${depthClass}`,
        textColor
      );
    });  
  }, [coloresLeyenda]);
  
  function hasAnyRowActions(row) {
    const depth = getNodeDepth(row.original);
    switch (depth) {
      case 0: // Objetivo
        return can('editar') || can('editar_porcentajes') || can('asociaciones') || can('crear');
      case 1: // Perspectiva
        return can('editar') || can('asociacionasociacioneses_perspectiva') || can('editar_porcentajes') || can('crear');
      case 2: // Criterio
        return can('editar') || can('asociaciones') || can('editar_porcentajes') || can('crear');
      case 3: // Indicador
        return can('editar') || can('asociaciones') || can('editar_porcentajes') || can('auditar_evidencia') || can('asociaciones') || can('crear');
      case 4: // Evidencia
        return can('editar') || can('evaluar_evidencia') || can('subir_evidencia') || can('ver_evidencia');
      default:
        return false;
    }
  }

  const handleMenuClick = (e, rowId) => {
    e.stopPropagation();
    const currentTarget = e.currentTarget;

    if (rowMenuId === rowId) {
      setRowMenuId(null); // Cierra si se hace clic en el mismo botón
    } else {
      const rect = currentTarget.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom, left: rect.left }); // Posición inicial
      setRowMenuId(rowId); // Abre el menú
    }
  };
  const getRowId = (row) => {
    const lz = row.id_lanzamiento ?? row.idLanzamiento ?? 0;
    const obj = row.id_objetivo ?? row.idObjetivo ?? 0;
    const pers = row.id_perspectiva ?? row.idPerspectiva ?? 0;
    const cri = row.id_criterio ?? row.idCriterio ?? 0;
    const ind = row.id_indicador ?? row.idIndicador ?? 0;
    const evi = row.id_evidencia ?? row.idEvidencia ?? 0;
    const su = row._searchUid ? String(row._searchUid) : null;
    return su ? `${lz}-${obj}-${pers}-${cri}-${ind}-${evi}-${su}` : `${lz}-${obj}-${pers}-${cri}-${ind}-${evi}`;
  };


  const handleSavedFromModal = (type, saved) => {
    // cerrar modal
    closeModal();

    if (!saved) {
      loadTreeData();
      return;
    }

    const lzId = selectedLz?.id_lanzamiento ?? saved.id_lanzamiento ?? selectedLz?.id;

    switch(type) {
      case 'objective': {
        // si ya existía, hacer update, si es nuevo, insert en raíz del lanzamiento
        const rowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo: saved.id_objetivo });
        updateNodeByRowId(rowId, n => ({ ...n, ...saved }));
        const rootParentId = `${lzId}-0-0-0-0-0`;
        insertChildUnderRowId(rootParentId, { ...saved, id_lanzamiento: lzId });
        break;
      }

      case 'perspectiva': {
        // parent debe venir en saved.id_objetivo
        const parentRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo: saved.id_objetivo });
        const rowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo: saved.id_objetivo, id_perspectiva: saved.id_perspectiva });
        updateNodeByRowId(rowId, n => ({ ...n, ...saved }));
        insertChildUnderRowId(parentRowId, { ...saved, id_lanzamiento: lzId, id_objetivo: saved.id_objetivo });
        setExpanded(prev => ({ ...prev, [parentRowId]: true }));
        break;
      }

      case 'criterio': {
        const parentRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo: saved.id_objetivo, id_perspectiva: saved.id_perspectiva });
        const rowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo: saved.id_objetivo, id_perspectiva: saved.id_perspectiva, id_criterio: saved.id_criterio });
        updateNodeByRowId(rowId, n => ({ ...n, ...saved }));
        insertChildUnderRowId(parentRowId, { ...saved, id_lanzamiento: lzId });
        setExpanded(prev => ({ ...prev, [parentRowId]: true }));
        break;
      }

      case 'indicador': {
        const parentRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo: saved.id_objetivo, id_perspectiva: saved.id_perspectiva, id_criterio: saved.id_criterio });
        const rowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo: saved.id_objetivo, id_perspectiva: saved.id_perspectiva, id_criterio: saved.id_criterio, id_indicador: saved.id_indicador });
        updateNodeByRowId(rowId, n => ({ ...n, ...saved }));
        insertChildUnderRowId(parentRowId, { ...saved, id_lanzamiento: lzId });
        setExpanded(prev => ({ ...prev, [parentRowId]: true }));
        break;
      }

      case 'evidencia': {
        const parentRowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo: saved.id_objetivo, id_perspectiva: saved.id_perspectiva, id_criterio: saved.id_criterio, id_indicador: saved.id_indicador });
        const rowId = getRowIdFromNode({ id_lanzamiento: lzId, id_objetivo: saved.id_objetivo, id_perspectiva: saved.id_perspectiva, id_criterio: saved.id_criterio, id_indicador: saved.id_indicador, id_evidencia: saved.id_evidencia });
        updateNodeByRowId(rowId, n => ({ ...n, ...saved }));
        insertChildUnderRowId(parentRowId, { ...saved, id_lanzamiento: lzId });
        setExpanded(prev => ({ ...prev, [parentRowId]: true }));
        break;
      }

      default:
        loadTreeData();
    }
  };
  const handleAssocDone = (type, result) => {
    // result: { action: 'asociar'|'desasociar', item: {...} }   (los modales ya te envían esa forma)
    if (!result) {
      loadTreeData();
      return;
    }
    const { action, item } = result;
    const lzId = selectedLz?.id_lanzamiento ?? item?.id_lanzamiento ?? 0;

    // pequeño helper para crear rowId (usa la función del hook)
    const makeRowId = (nodeLike) => getRowIdFromNode(nodeLike);

    if (action === 'asociar') {
      // Insertar nodo hijo bajo su padre (sin recargar)
      let parentNode = null;
      let newNode = null;
      switch (type) {
        case 'perspectiva': {
          const parentRowId = makeRowId({ id_lanzamiento: lzId, id_objetivo: item.id_objetivo ?? item.idObjetivo ?? item.parent_id ?? 0 });
          newNode = {
            ...item,
            id_perspectiva: item.id_perspectiva ?? item.id,
            id_objetivo: item.id_objetivo ?? item.idObjetivo ?? item.parent_id ?? item.id_objetivo,
            id_lanzamiento: lzId,
            subRows: []
          };
          insertChildUnderRowId(parentRowId, newNode, { addToStart: false });
          setExpanded(prev => ({ ...prev, [parentRowId]: true }));
          break;
        }
        case 'criterio': {
          const parentRowId = makeRowId({ id_lanzamiento: lzId, id_objetivo: item.id_objetivo ?? 0, id_perspectiva: item.id_perspectiva ?? item.idPerspectiva ?? item.parent_id ?? 0 });
          newNode = {
            ...item,
            id_criterio: item.id_criterio ?? item.id,
            id_perspectiva: item.id_perspectiva ?? item.idPerspectiva ?? item.parent_id ?? 0,
            id_lanzamiento: lzId,
            subRows: []
          };
          insertChildUnderRowId(parentRowId, newNode, { addToStart: false });
          setExpanded(prev => ({ ...prev, [parentRowId]: true }));
          break;
        }
        case 'indicador': {
          const parentRowId = makeRowId({
            id_lanzamiento: lzId,
            id_objetivo: item.id_objetivo ?? 0,
            id_perspectiva: item.id_perspectiva ?? 0,
            id_criterio: item.id_criterio ?? item.idCriterio ?? item.parent_id ?? 0
          });
          newNode = {
            ...item,
            id_indicador: item.id_indicador ?? item.id,
            id_criterio: item.id_criterio ?? item.idCriterio ?? item.parent_id ?? 0,
            id_lanzamiento: lzId,
            subRows: []
          };
          insertChildUnderRowId(parentRowId, newNode, { addToStart: false });
          setExpanded(prev => ({ ...prev, [parentRowId]: true }));
          break;
        }
        case 'evidencia': {
          const parentRowId = makeRowId({
            id_lanzamiento: lzId,
            id_objetivo: item.id_objetivo ?? 0,
            id_perspectiva: item.id_perspectiva ?? 0,
            id_criterio: item.id_criterio ?? 0,
            id_indicador: item.id_indicador ?? item.id
          });
          newNode = {
            ...item,
            id_evidencia: item.id_evidencia ?? item.id,
            id_indicador: item.id_indicador ?? item.id,
            id_lanzamiento: lzId,
            subRows: []
          };
          insertChildUnderRowId(parentRowId, newNode, { addToStart: false });
          setExpanded(prev => ({ ...prev, [parentRowId]: true }));
          break;
        }
        case 'objetivo': {
          // Si asociamos un objetivo al lanzamiento, simplemente recargamos primer nivel
          loadTreeData();
          break;
        }
        default:
          loadTreeData();
      }
      return;
    }

    if (action === 'desasociar') {
      // Preferimos removeNodeByTypeId (más directo)
      switch (type) {
        case 'perspectiva':
          removeNodeByTypeId('perspectiva', item.id_perspectiva ?? item.id ?? item.idPerspectiva ?? item.id_perspectiva);
          break;
        case 'criterio':
          removeNodeByTypeId('criterio', item.id_criterio ?? item.id ?? item.idCriterio ?? item.id_criterio);
          break;
        case 'indicador':
          removeNodeByTypeId('indicador', item.id_indicador ?? item.id ?? item.idIndicador ?? item.id_indicador);
          break;
        case 'evidencia':
          removeNodeByTypeId('evidencia', item.id_evidencia ?? item.id ?? item.idEvidencia ?? item.id_evidencia);
          break;
        case 'objetivo':
          removeNodeByTypeId('objetivo', item.id_objetivo ?? item.id ?? item.idObjetivo ?? item.id_objetivo);
          break;
        default:
          // Si no estamos seguros, recargamos
          loadTreeData();
      }
      return;
    }

    // fallback
    loadTreeData();
  };

  const legendItems = [ { depth: 0, label: 'Objetivos' }, { depth: 1, label: 'Perspectivas' }, { depth: 2, label: 'Criterios' }, { depth: 3, label: 'Indicadores' }, { depth: 4, label: 'Evidencias' },];

  useEffect(() => { if (initialLanzamiento) setSelectedLz(initialLanzamiento); }, [initialLanzamiento, setSelectedLz]);

  useEffect(() => { if (permSetFromParent) setPermSet(permSetFromParent); }, [permSetFromParent, setPermSet]);

  useEffect(() => { loadTreeData(); }, [selectedLz]);
  const AuditCell = ({ idEvidencia }) => {
    const cache = auditCache?.[idEvidencia];

    useEffect(() => {
      if (!idEvidencia) return;
      if (!cache) {
        // fetchAuditFor poblará auditCache[idEvidencia]
        fetchAuditFor(idEvidencia).catch(() => {
          /* ya manejado en fetchAuditFor */
        });
      }
    }, [idEvidencia, cache]);

    if (!idEvidencia) return null;

    // Loading
    if (!cache || cache.loading) return <span style={{ color: '#888' }}>...</span>;
    // Error
    if (cache.error) return <span title={cache.error} style={{ color: '#c00' }}>Error</span>;

    const data = cache.data;
    if (!data) return <span style={{ color: '#666' }}>Sin auditoría</span>;

    // data puede ser un array de eventos o un solo evento
    const events = Array.isArray(data) ? data : [data];

    // Normalizar: preferimos el primer evento que NO sea ELIMINAR
    const nonEliminarEvent = events.find(ev => {
      if (!ev || !ev.accion) return true; // si no tiene accion lo consideramos válido
      return String(ev.accion).toUpperCase() !== 'ELIMINAR';
    });

    // Elegimos el evento preferido (si existe no-eliminar, sino el más reciente)
    const chosen = nonEliminarEvent ?? events[0];

    // Si el evento elegido explícitamente es ELIMINAR => mostrar "Sin responsable"
    if (chosen && chosen.accion && String(chosen.accion).toUpperCase() === 'ELIMINAR') {
      return <span style={{ color: '#666' }}>Sin responsable</span>;
    }

    // Normalizar usuario dentro del evento
    const usuario = chosen.usuario ?? chosen.usuarioSubio ?? chosen.usuario_subio ?? null;

    const buildUserLabel = (u) => {
      if (!u) return null;
      const nombres = u.nombres ?? u.name ?? u.nombres_completos ?? '';
      const apellidos = u.apellidos ?? u.surname ?? '';
      const combined = `${nombres} ${apellidos}`.trim();
      if (combined) return combined;
      if (u.correo || u.email) return u.correo ?? u.email;
      if (u.id_usuario || u.id) return `#${u.id_usuario ?? u.id}`;
      return null;
    };

    const userLabel = buildUserLabel(usuario) ?? (chosen.id_usuario ? `#${chosen.id_usuario}` : null);

    if (!userLabel) return <span style={{ color: '#666' }}>Sin responsable</span>;
    const fechaStr = chosen.fecha_evento ?? chosen.fecha ?? chosen.createdAt ?? chosen.created_at ?? null;
    const fechaFormatted = fechaStr ? (() => {
      try { return new Date(fechaStr).toLocaleString(); } catch { return null; }
    })() : null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: '0.95rem' }}>{userLabel}</div>
        {/*{fechaFormatted && <div style={{ fontSize: '0.75rem', color: '#666' }}>{fechaFormatted}</div>}*/}
      </div>
    );
  };
  useEffect(() => {
    const loadUsersByEvidence = async () => {
      try {
        // 1) aplanar recursivamente todo el árbol para obtener todos los nodos
        const collectAll = (nodes = []) => {
          const out = [];
          const recurse = (arr) => {
            if (!Array.isArray(arr)) return;
            for (const n of arr) {
              out.push(n);
              if (Array.isArray(n.subRows) && n.subRows.length) recurse(n.subRows);
            }
          };
          recurse(nodes);
          return out;
        };

        const flat = collectAll(treeData || []);

        // 2) obtener solo nodos que son evidencias (tolerante a distintas formas)
        const evidences = flat.filter(n => {
          if (!n) return false;
          return Boolean(n.id_evidencia || n.tipo === 'evidencia' || (n.id && (n.id_evidencia || n.idEvidencia)));
        });

        if (evidences.length === 0) {
          // opcional: limpiar estado si no hay evidencias
          setUsersByEvidence({});
          return;
        }

        // 3) deduplicar ids por si acaso
        const uniqueIds = Array.from(new Set(evidences.map(ev => String(ev.id_evidencia ?? ev.id ?? '')))).filter(Boolean);

        // 4) lanzar llamadas en paralelo (Promise.allSettled para tolerancia)
        const promises = uniqueIds.map(eId =>
          getUsersWithPermissionForEvidence(eId)
            .then(resp => {
              // normalizar respuesta: la API podría devolver array directo o { data: [...] }
              if (Array.isArray(resp)) return { eId, users: resp };
              if (resp && Array.isArray(resp.data)) return { eId, users: resp.data };
              // fallback: si devuelve objeto con success/data diferente
              const maybe = resp && (resp.data ?? resp.users ?? []);
              return { eId, users: Array.isArray(maybe) ? maybe : [] };
            })
            .catch(err => {
              console.error(`getUsersWithPermissionForEvidence error for ${eId}:`, err);
              return { eId, users: [] };
            })
        );

        const settled = await Promise.allSettled(promises);

        // 5) montar mapa final
        const map = {};
        settled.forEach(s => {
          if (s.status === 'fulfilled' && s.value) {
            map[String(s.value.eId)] = Array.isArray(s.value.users) ? s.value.users : [];
          } else if (s.status === 'rejected') {
            console.warn('Promise rechazó en loadUsersByEvidence:', s.reason);
          }
        });

        setUsersByEvidence(map);
      } catch (err) {
        console.error('Error general cargando usuarios por evidencia:', err);
        setUsersByEvidence({});
      }
    };

    loadUsersByEvidence();
  }, [treeData]); 
  const columns = React.useMemo(() => {
    const cols = [];

    /*cols.push({
      id: 'mini_info',
      header: '',
      cell: ({ row }) => {
        const realDepth = getNodeDepth(row.original);
        const isEvidencia = realDepth === 4 || row.original?.tipo === 'evidencia';
        if (!isEvidencia) return null;
        const hasViewFiles = can('ver_archivos') || can('ver_evidencia');
        if (!hasViewFiles) return null;

        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn-ver-leyenda-archivos"
              onClick={(e) => {
                e.stopPropagation();
                openInfoPopup(row.original, e.currentTarget);
              }}
              aria-label={`Info ${row.original?.nombre ?? ''}`}
              title="Ver historial (usuario / fecha)"
            >
              i
            </button>
          </div>
        );
      },
      size: 150
    });*/

    cols.push({
      id: 'tree',
      header: 'Nombre',
      accessorFn: r => r.nombre || r.descripcion || '',
      cell: ({ row }) => {
        const rowId = row.id;
        const d = getNodeDepth(row.original);
        const isLoading = loadingChildren[rowId];
        const isEvidencia = Boolean(row.original?.id_evidencia || row.original?.tipo === 'evidencia');
        const canExpand = (row.getCanExpand() || row.original?._hasChildren) && !isEvidencia;
        const isExpanded = Boolean(expanded[rowId]);

        return (
          <div className={`cell depth-${d}`}>
            {canExpand && (
              <button onClick={(e) => { onExpandButtonClick(e, row); }} className="expand-btn" >
                {expanded[row.id] ? '▾' : '▸'}
              </button>
            )}
            <span>{row.original?.descripcion ?? row.original?.nombre ?? ''}</span>
          </div>
        );
      },
      size: 300
    });
    if (can('ver_auditoria')) {
      cols.push({
        id: 'auditoria',
        header: 'Responsable',
        cell: ({ row }) => {
          const realDepth = getNodeDepth(row.original);
          const isEvidencia = realDepth === 4 || row.original?.tipo === 'evidencia';
          if (!isEvidencia) return null;

          const id = row.original?.id_evidencia ?? row.original?.id;
          return <AuditCell idEvidencia={id} />;
        },
        size: 220
      });
    };
    cols.push({
      id: 'mini_info',
      header: 'Actores',
      cell: ({ row }) => {
        const realDepth = getNodeDepth(row.original);
        const isEvidencia = realDepth === 4 || row.original?.tipo === 'evidencia';
        if (!isEvidencia) return null;

        return (
          <div className="contenedor-elementos-archivo" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn-ver-leyenda-archivos"
              onClick={(e) => {
                e.stopPropagation();
                openActorsPopup(row.original, e.currentTarget);
              }}
              aria-label={`Actores ${row.original?.nombre ?? ''}`}
              title="Ver actores"
            >
              i
            </button>
          </div>
        );
      },
      size: 150
    });
    if(can('ver_ponderacion')){
      cols.push(
        { accessorKey: 'porcentaje', header: 'Ponderacion', cell: ({ getValue }) => `${(Number(getValue())||0).toFixed(2)}%` }
      )
    };
    cols.push(
      { id: 'estado', header: 'Estado', accessorFn: r => r.estado || r.estado, cell: ({ row }) => { const d = row.original.estado || row.original.estado; return d ? d : '—'; }, size: 120 },
      { id: 'valor_global', header: 'Porcentaje de avance (global)', accessorFn: r => r.valor ?? 0, cell: ({ getValue }) => { const v = Number(getValue()) || 0; return `${(v * 100).toFixed(2)}%`; }, size: 160 },
      { id: 'valor_local', header: 'Porcentaje por usuario', accessorFn: r => r.valorLocal ?? r.valor ?? 0, cell: ({ getValue }) => { const v = Number(getValue()) || 0; return `${(v * 100).toFixed(2)}%`; }, size: 100 }
    );

    cols.push({
      id: 'archivos',
      header: 'Archivos',
      cell: ({ row }) => {
        const realDepth = getNodeDepth(row.original);
        const isEvidencia = realDepth === 4 || row.original?.tipo === 'evidencia';
        if (!isEvidencia) return null;
        const hasViewFiles = can('ver_archivos') || can('ver_evidencia');
        if (!hasViewFiles) return null;
        return (
          <div className="contenedor-elementos-archivo" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn-ver-archivos"
              onClick={(e) => {
                e.stopPropagation();
                openVerAdjuntos(row.original);
              }}
              aria-label={`Ver archivos ${row.original?.nombre ?? ''}`}
            >
              Ver archivos
            </button>
            <button
              className="btn-ver-leyenda-archivos"
              onClick={(e) => {
                e.stopPropagation();
                openInfoPopup(row.original, e.currentTarget);
              }}
              aria-label={`Info ${row.original?.nombre ?? ''}`}
              title="Ver historial (usuario / fecha)"
            >
              i
            </button>
          </div>
        );
      },
      size: 150
    });

    return cols;
  }, [loadingChildren, globalPercent, expanded, openVerAdjuntos, /* importante: dependencias relacionadas con permisos */ mergedPerms]);


  const table = useReactTable({
    data: visibleData,
    columns,
    getRowId,
    state: { expanded: hookExpanded },      // usa el expanded del hook
    onExpandedChange: (newExp) => {
      setHookExpanded(newExp);
    },
    getSubRows: r => r.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel()
  });

  useEffect(() => { console.debug('treeData:', treeData); }, [treeData]);

  const { type: modalType, visible: modalVisible, payload: modalPayload } = modalState;

  const openEditObj = (obj) => {
    // edit objetivo: pasamos el objeto tal cual al modal
    openModal('objective', { data: obj, lanzamientoId: selectedLz?.id_lanzamiento });
  };

  const openCreateObj = () => {
    // crear objetivo en el lanzamiento seleccionado
    openModal('objective', { data: null, lanzamientoId: selectedLz?.id_lanzamiento });
  };

  const openCreatePers = (objetivo) => {
    // crear perspectiva asociada a un objetivo
    openModal('perspectiva', { parentObjetivo: objetivo, lanzamientoId: selectedLz?.id_lanzamiento });
  };

  const openEditPers = (pers) => {
    openModal('perspectiva', { data: pers, parentObjetivo: { id_objetivo: pers.id_objetivo }, lanzamientoId: selectedLz?.id_lanzamiento });
  };

  const openCreateCri = (perspectiva) => {
    openModal('criterio', { parentPerspectiva: perspectiva, lanzamientoId: selectedLz?.id_lanzamiento });
  };

  const openEditCri = (criterio) => {
    openModal('criterio', { data: criterio, parentPerspectiva: { id_perspectiva: criterio.id_perspectiva } , lanzamientoId: selectedLz?.id_lanzamiento});
  };

  const openCreateInd = (criterio) => {
    openModal('indicador', { parentCriterio: criterio, lanzamientoId: selectedLz?.id_lanzamiento });
  };

  const openEditInd = (indicador) => {
    openModal('indicador', { data: indicador, parentCriterio: { id_criterio: indicador.id_criterio }, lanzamientoId: selectedLz?.id_lanzamiento });
  };

  const openCreateEvi = (indicador) => {
    openModal('evidencia', { parentIndicador: indicador, lanzamientoId: selectedLz?.id_lanzamiento, userId: user?.id });
  };

  const openEditEvi = (evidencia) => {
    openModal('evidencia', { data: evidencia, parentIndicador: { id_indicador: evidencia.id_indicador }, lanzamientoId: selectedLz?.id_lanzamiento, userId: user?.id });
  };
  const doApproveEvi = async (id_evidencia, row) => {
    if (!id_evidencia) return;
    const rowId = row.id; 

    try {
      updateNodeByRowId(rowId, n => ({ ...n, estado: 'aprobando' }));

      const resp = await updateEvidencia(id_evidencia, { estado: 'aprobada', id_usuario: user?.id });
      const updated = (resp && (resp.data ?? resp)) || { estado: 'aprobada' };

      updateNodeByRowId(rowId, n => ({ ...n, ...updated }));

      setRowMenuId(null);
    } catch (err) {
      console.error('Error aprobando evidencia', err);
      updateNodeByRowId(rowId, n => ({ ...n, estado: 'pendiente' }));
      setRowMenuId(null);
    }
  };
  const doDeclineEvi = async (id_evidencia, row) => {
    if (!id_evidencia) return;
    const rowId = row.id;
    try {
      updateNodeByRowId(rowId, n => ({ ...n, estado: 'rechazada' }));

      const resp = await updateEvidencia(id_evidencia, { estado: 'rechazada', id_usuario: user?.id });
      const updated = (resp && (resp.data ?? resp)) || { estado: 'rechazada' };

      updateNodeByRowId(rowId, n => ({ ...n, ...updated }));
      setRowMenuId(null);
    } catch(e){ console.error(e); }
  };
    const doPendingEvi = async (id_evidencia,row) => {
      if (!id_evidencia) return;
      const rowId = row.id;
      try {
        await updateEvidencia(id_evidencia,{estado: 'pendiente', id_usuario: user?.id});
        updateNodeByRowId(rowId, n => ({...n, estado:'pendiente'}));
        setRowMenuId(null);
      }catch(e){console.error(e);}
    };
    const doObserveEvi = async (id_evidencia, row) => {
      if (!id_evidencia) return;
      const rowId = row.id;
      try {
        await updateEvidencia(id_evidencia,{estado: 'observacion', id_usuario: user?.id});
        updateNodeByRowId(rowId, n => ({...n, estado:'observacion'}));
        setRowMenuId(null);
      }catch(e){console.error(e);}
    };
    const doDeleteEvi = async (e) => {
    const rowId = getRowIdFromNode(e);
    try {
      await deleteEvidencia(e.id_evidencia);
      removeNodeByRowId(rowId);
      setRowMenuId(null);
    } catch (err) { console.error(err); }
  };
  return (
    <div ref={containerRef} className="treegrid-container">
      
      <div className="toolbar">
        <select className="select-lanzamiento" value={selectedLz?.id_lanzamiento || ''} onChange={e => setSelectedLz(lanzamientos.find(l => +l.id_lanzamiento === +e.target.value))}>
          {lanzamientos.map(l => <option key={l.id_lanzamiento} value={l.id_lanzamiento}>{l.descripcion}</option>)}
        </select>
        <div className="search-container">
          <FilterBar
            mode={mode}
            setMode={setMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchScope={searchScope}
            setSearchScope={setSearchScope}
            placeholder="Buscar..."
            onSearch={performSearch} 
            disabled={isSearching || isLoadingTree}
          />
        </div>
          { hasGlobalObjectivePerms && (
            <div className="menu-wrapper" ref={containerRef}>
              <i
                className="bx bx-dots-vertical-rounded menu-icon"
                onClick={() => setAssocMode('menu')}
              />
              {assocMode === 'menu' && (
                <div className="global-menu">
                  {can('crear') && (<button onClick={() => { setAssocMode('crear'); openCreateObj({ type: '', visible: true, target: null }) }}>Crear Objetivo</button>)}
                  {can('asociaciones') && (<button onClick={() => { setAssocMode('asociar'); openModal('assoc', { target: null }); }}>Asociar Objetivo</button>)}
                  {can('asociaciones') && (<button onClick={() => { setAssocMode('disasociar'); openModal('assoc', { target: null }); }}>Desasociar Objetivo</button>)}
                </div>
              )}
            </div>
          )}
        
      </div>
      <div className="legend-container">
        <div className="legend">
          {legendItems.map(({ depth, label }) => (
          <div key={depth} className="legend-item">
            <span
              className={`legend-box depth-${depth}`}
              onClick={() => setOpenDepth(depth)}
              style={{ cursor: 'pointer', backgroundColor: coloresLeyenda[`depth-${depth}`] }}
              title="Haz click para configurar color"
            />
            <span
              onClick={() => setOpenDepth(depth)}
              style={{ cursor: 'pointer', marginLeft: 8 }}
            >
              {label}
            </span>
          </div>
          ))}
        </div>
        {openDepth !== null && (
        <ConfigPanel
        depth={openDepth}
        onClose={() => setOpenDepth(null)}
        key={openDepth} // <-- fuerza el remontarrrrr para que se actualice correctamente
          />
        )}
      </div>
      <table className="treegrid-table">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map((h, index) => (
                <th 
                  key={h.id}
                  className={
                    index === 0 ? 'sticky-col sticky-col-0' :
                    /* index === 1 ? 'sticky-col sticky-col-1' : */
                    undefined
                  }
                  >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
              <th className="menu-col"> Acciones </th>
            </tr>
          ))}
        </thead>
        <tbody>
          <LoadingRow 
            isLoading={isLoadingTree} 
            message="Cargando datos..." 
            colSpan={columns.length + 1} 
          />
          <LoadingRow 
            isLoading={isSearching} 
            message="Buscando resultados..." 
            colSpan={columns.length + 1} 
          />
          {!isLoadingTree && !isSearching && table.getRowModel().rows.map(row => (
              <React.Fragment key={row.id}>
              <tr
                className={`${row.getIsExpanded() ? 'expanded' : ''} depth-${getNodeDepth(row.original)}`}
                style={{ '--row-bg-color': coloresLeyenda[`depth-${getNodeDepth(row.original)}`] || 'transparent' }}
              >
                  {row.getVisibleCells().map((cell, index) => {
                    const realDepth = getNodeDepth(row.original); // 0..4 según el tipo del nodo
                    const depthClass = `depth-${realDepth}`;
                    return (
                      <td
                        key={cell.id}
                        className={
                          index === 0 ? 'sticky-col sticky-col-0' :
                          /* index === 1 ? 'sticky-col sticky-col-1' : */
                          undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                  <td
                    className="accions"
                  >
                    { hasAnyRowActions(row) && (
                      <button className="menu-cell" 
                        onClick={e => handleMenuClick(e, row.id)}
                        > 
                        <i className="bx bx-dots-vertical-rounded" />
                      </button> 
                    )}
                    {rowMenuId === row.id && (
                      <div 
                      ref={menuRef}
                      className="row-action-menu"
                      style={{
                        position: 'fixed',
                        top: `${calculatedMenuPosition.top}px`,
                        left: `${calculatedMenuPosition.left}px`,
                      }}
                      >
                        {getNodeDepth(row.original) === 0 && <>
                          {can('editar') && (<button onClick={e => {e.stopPropagation();setRowMenuId(null);openEditObj(row.original)}}>Editar Objetivo</button> )}
                          {can('crear') && (<button onClick={e => {e.stopPropagation();setRowMenuId(null);openCreatePers(row.original)}}>Crear Perspectiva</button> )}
                          {can('asociaciones') && (<button onClick={e => { e.stopPropagation(); setRowMenuId(null); setPersAssocMode('asociar'); openModal('assoc', { target: row.original });  }}>Asociar Perspectiva</button> )}
                          {can('asociaciones') && (<button onClick={e => { e.stopPropagation(); setRowMenuId(null); setPersAssocMode('disasociar'); openModal('assoc', { target: row.original }); }}>Desasociar Perspectiva</button>)}
                          {can('editar_porcentajes') && (<button onClick={e => {e.stopPropagation(); setRowMenuId(null); setPercentModal({ depth: row.depth, items: row.original.subRows, parent: row.original.id_objetivo });}}>Editar % Perspectivas</button>)}
                        </>}
                        {getNodeDepth(row.original) === 1 && <>
                          {can('editar') && <button onClick={e => {e.stopPropagation();setRowMenuId(null); openEditPers(row.original)}}>Editar Perspectiva</button>}
                          {can('crear') && <button onClick={e => {e.stopPropagation();setRowMenuId(null);openCreateCri(row.original)}}>Crear Criterio</button>}
                          {can('asociaciones') && <button onClick={e => {e.stopPropagation(); setRowMenuId(null);  setCriAssocMode('asociar'); openModal('assoc', { target: row.original });}}>Asociar Criterio</button>}
                          {can('asociaciones') && <button onClick={e => {e.stopPropagation(); setRowMenuId(null);  setCriAssocMode('disasociar'); openModal('assoc', { target: row.original });}}>Desasociar Criterio</button>}
                          {can('editar_porcentajes') && <button onClick={e => {e.stopPropagation(); setRowMenuId(null); setPercentModal({ depth: row.depth, items: row.original.subRows, parent: row.original.id_perspectiva });}}> Editar % Criterios</button>}
                        </>}
                        {getNodeDepth(row.original) === 2 && <>
                          {can('editar') && <button onClick={e => {e.stopPropagation();setRowMenuId(null);openEditCri(row.original)}}>Editar Criterio</button>}
                          {can('crear') && <button onClick={e => {e.stopPropagation();setRowMenuId(null);openCreateInd(row.original)}}>Crear Indicador</button>}
                          {can('asociaciones') && <button onClick={e => {e.stopPropagation(); setRowMenuId(null);  setIndAssocMode('asociar'); openModal('assoc', { target: row.original });}}>Asociar Indicador</button>}
                          {can('asociaciones') && <button onClick={e => {e.stopPropagation(); setRowMenuId(null);  setIndAssocMode('disasociar'); openModal('assoc', { target: row.original });}}>Desasociar Indicador</button>}
                          {can('editar_porcentajes') && <button onClick={e => {e.stopPropagation(); setRowMenuId(null); setPercentModal({ depth: row.depth, items: row.original.subRows, parent: row.original.id_criterio });}}> Editar % Indicadores</button>}
                        </>}
                        {getNodeDepth(row.original) === 3 && <>
                          {can('editar') && <button onClick={e => {e.stopPropagation();setRowMenuId(null);openEditInd(row.original)}}>Editar Indicador</button>}
                          {can('crear') && <button onClick={e => {e.stopPropagation();setRowMenuId(null);openCreateEvi(row.original)}}>Crear Evidencia</button>}
                          {can('asociaciones') && <button onClick={e => {e.stopPropagation(); setRowMenuId(null);  setEviAssocMode('asociar'); openModal('assoc', { target: row.original });}}>Asociar Evidencia</button>}
                          {can('asociaciones') && <button onClick={e => {e.stopPropagation(); setRowMenuId(null);  setEviAssocMode('disasociar'); openModal('assoc', { target: row.original });}}>Desasociar Evidencia</button>}
                          {can('auditar_evidencia') && ( <button onClick={e => {e.stopPropagation(); setRowMenuId(null);  setIndicatorForAssign(row.original); setShowAssignModal(true); }}> Asignar responsable (Auditoría) </button>)}</>}
                        {getNodeDepth(row.original) === 4 && <>
                          {can('editar') && (<button onClick={e => {e.stopPropagation(); setRowMenuId(null); openEditEvi(row.original)}}>Editar Evidencia</button>)}
                          {can('evaluar_evidencia') && (<button onClick={() => doApproveEvi(row.original.id_evidencia, row)}>Aprobar Evidencia</button>)}
                          {can('evaluar_evidencia') && (<button onClick={() => doDeclineEvi(row.original.id_evidencia, row)}>Rechazar Evidencia</button>)}
                          {can('evaluar_evidencia') && (<button onClick={() => doObserveEvi(row.original.id_evidencia, row)}>En Observacion</button>)}
                          {can('evaluar_evidencia') && (<button onClick={() => doPendingEvi(row.original.id_evidencia, row)}>Pendiente</button>)}
                          {can('subir_evidencia') && (<button onClick={e => {e.stopPropagation();setRowMenuId(null);setSelectedEvidenciaId(row.original.id_evidencia);setShowFullPageModal(true);}}>Subir Archivos</button>)}
                          {can('eliminar_evidencia') && (<button onClick={e => {e.stopPropagation(); setRowMenuId(null); doDeleteEvi(row.original)}}>Eliminar</button>)}
                        </>}
                      </div>
                    )}
                  </td>
                </tr>
              </React.Fragment>
          ))}
        </tbody>
      </table>
      {percentModal && (() => {
        return(
          <PorcentajeModal
            show={true}
            items={percentModal.items}
            onCancel={() => setPercentModal(null)}
            onSave={async updatedItems => {
              // llamamos a la megaapi según depth:
              const { depth, parent} = percentModal;
              if (depth === 0) {
                // actualizar perspectivas de un objetivo
                for (let it of updatedItems) {
                  await updatePorcentajePerspectiva(parent,it.id_perspectiva ,it.porcentaje);
                }
              } else if (depth === 1) {
                // actualizar criterios de perspectiva
                for (let it of updatedItems) {
                  await updatePorcentajeCriterio(parent,it.id_criterio ,it.porcentaje);
                }
              } else if (depth === 2) {
                // actualizar indicadores de criterio
                for (let it of updatedItems) {
                  await updatePorcentajeIndicador(parent, it.id_indicador,it.porcentaje);
                }
              }
              setPercentModal(null);
              await loadTreeData();  // recarga todo
            }}
          />
        )
      })()}
      <ObjectiveModal
        visible={modalVisible && modalType === 'objective'}
        data={modalPayload?.data ?? modalPayload}
        lanzamientoId={modalPayload?.lanzamientoId ?? selectedLz?.id_lanzamiento}
        onClose={closeModal}
        onSaved={(saved) => handleSavedFromModal('objective', saved)}
      />

      <PerspectivaModal
        visible={modalVisible && modalType === 'perspectiva'}
        data={modalPayload?.data ?? modalPayload}
        lanzamientoId={modalPayload?.lanzamientoId ?? selectedLz?.id_lanzamiento}
        parentObjetivo={modalPayload?.parentObjetivo}
        onClose={closeModal}
        onSaved={(saved) => handleSavedFromModal('perspectiva', saved)}
      />

      <CriterioModal
        visible={modalVisible && modalType === 'criterio'}
        data={modalPayload?.data ?? modalPayload}
        parentPerspectiva={modalPayload?.parentPerspectiva}
        lanzamientoId={modalPayload?.lanzamientoId ?? selectedLz?.id_lanzamiento}
        onClose={closeModal}
        onSaved={(saved) => handleSavedFromModal('criterio', saved)}
      />

      <IndicadorModal
        visible={modalVisible && modalType === 'indicador'}
        data={modalPayload?.data ?? modalPayload}
        parentCriterio={modalPayload?.parentCriterio}
        lanzamientoId={modalPayload?.lanzamientoId ?? selectedLz?.id_lanzamiento}
        onClose={closeModal}
        onSaved={(saved) => handleSavedFromModal('indicador', saved)}
      />

      <EvidenciaModal
        visible={modalVisible && modalType === 'evidencia'}
        data={modalPayload?.data ?? modalPayload}
        parentIndicador={modalPayload?.parentIndicador}
        lanzamientoId={modalPayload?.lanzamientoId ?? selectedLz?.id_lanzamiento}
        userId={modalPayload?.userId ?? user?.id}
        onClose={closeModal}
        onSaved={(saved) => handleSavedFromModal('evidencia', saved)}
      />
      <AssociateObjetivoModal
        visible={assocMode === 'asociar' || assocMode === 'disasociar'}
        mode={assocMode}
        lanzamientoId={selectedLz?.id_lanzamiento}
        onClose={() => { setAssocMode(null); closeModal(); }}
        onDone={(result) => { setPersAssocMode(null); closeModal(); handleAssocDone('objective', result); }}
      />

      <AssociatePerspectivaModal
        visible={Boolean(persAssocMode)}
        mode={persAssocMode}
        parentObjetivo={modalPayload?.target} 
        onClose={() => { setPersAssocMode(null); closeModal(); }}
        onDone={(result) => { setPersAssocMode(null); closeModal(); handleAssocDone('perspectiva', result); }}
      />

      <AssociateCriterioModal
        visible={Boolean(criAssocMode)}
        mode={criAssocMode}
        parentPerspectiva={modalPayload?.target}
        onClose={() => { setCriAssocMode(null); closeModal(); }}
        onDone={(result) => { setPersAssocMode(null); closeModal(); handleAssocDone('criterio', result); }}
      />

      <AssociateIndicadorModal
        visible={Boolean(indAssocMode)}
        mode={indAssocMode}
        parentCriterio={modalPayload?.target}
        onClose={() => { setIndAssocMode(null); closeModal(); }}
        onDone={(result) => { setPersAssocMode(null); closeModal(); handleAssocDone('indicador', result); }}
      />

      <AssociateEvidenciaModal
        visible={Boolean(eviAssocMode)}
        mode={eviAssocMode}
        parentIndicador={modalPayload?.target}
        onClose={() => { setEviAssocMode(null); closeModal(); }}
        onDone={(result) => { setPersAssocMode(null); closeModal(); handleAssocDone('evidencia', result); }}
      />
      <MiniInfoPopup
        visible={infoPopup.visible}
        top={infoPopup.top}
        left={infoPopup.left}
        entries={infoPopup.entries || []}
        onClose={closeInfoPopup}
      />
      <ActorsPopup
        visible={actorsPopup.visible}
        top={actorsPopup.top}
        left={actorsPopup.left}
        entries={actorsPopup.entries}
        onClose={closeActorsPopup}
      />
      <AssignEvidenceModal
        isOpen={showAssignModal}
        onClose={(dontReload) => {
          setShowAssignModal(false);
          setIndicatorForAssign(null);
        }}
        onAssigned={(updatedEvi) => {
          // actualizar solo la fila afectada en el tree
          try {
            const idEvi = updatedEvi.id_evidencia ?? updatedEvi.id;
            const node = findNodeByEvidenciaIdRef(idEvi);
            if (node) {
              const rowId = getRowIdFromNode(node);
              updateNodeByRowId(rowId, n => ({ ...n, ...updatedEvi }));
            } else {
              //console.warn('Nodo evidencia no encontrado en árbol local, recargando datos del Tree (fallback).');
              loadTreeData();
            }
          } catch (err) {
            console.error('Error actualizando nodo local tras asignación:', err);
            loadTreeData();
          } finally {
            setShowAssignModal(false);
            setIndicatorForAssign(null);
          }
        }}
        indicator={indicatorForAssign}
        evidencesProp={indicatorForAssign?.subRows ?? null}
        currentUser={user}
      />
      {/* Modal para subir adjuntos */}
        {eviModalId !== null && (
          <PopupSubirArchivos
            idEvidencia={eviModalId}
            onClose={() => setEviModalId(null)}
            onArchivosSubidos={() => {
              // El nuevo componente TablaArchivosPopup maneja su propia actualización
              //console.log('Archivos subidos exitosamente');
            }}
          />
        )}
        {showArchivosPopup && evidenciaIdArchivos && (
          <TablaArchivosPopup 
            onClose={() => {
              setShowArchivosPopup(false);
              setEvidenciaIdArchivos(null);
            }}
            evidencia_id={evidenciaIdArchivos}
            isClosing={false}
          />
        )}

        {/* Modal de página completa para subir archivos */}
        {showFullPageModal && (
          <div className={`full-page-modal-overlay ${isClosingModal ? 'closing' : ''}`}>
            <div className="full-page-modal-content">
              <SubirArchivosComponent 
                idEvidenciaProp={selectedEvidenciaId}
                onClose={handleCloseFullPageModal}
                isModal={true}
              />
            </div>
          </div>
        )}
    </div> 
  );
}
function obtenerIcono(nombreArchivo) {
  const ext = nombreArchivo.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return imageIcon;
  if (["pdf"].includes(ext)) return pdfIcon;
  if (["doc", "docx"].includes(ext)) return wordIcon;
  if (["xls", "xlsx"].includes(ext)) return excelIcon;
  if (["ppt", "pptx"].includes(ext)) return pptIcon;
  if (["txt"].includes(ext)) return txtfile;
  return fileIcon;
}
function PopupSubirArchivos({ idEvidencia, onClose, onArchivosSubidos }) {
  const [archivos, setArchivos] = useState([]);
  const [tiposArchivo, setTiposArchivo] = useState([]);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [dragActivo, setDragActivo] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    async function cargarTipos() {
      try {
        const tipos = await getTiposArchivo();
        setTiposArchivo(tipos);
      } catch {
        setMensaje({ texto: "Error al cargar tipos de archivo.", tipo: "error" });
      }
    }
    cargarTipos();
  }, []);

  function mostrarNotificacion(texto, tipo) {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 2500);
  }

  function handleArchivoChange(files) {
    const nuevosArchivos = Array.from(files).filter((file) => {
      const extension = file.name.split(".").pop().toLowerCase();
      const tipo = tiposArchivo.find(
        (t) => t.extension.toLowerCase() === extension
      );
      if (!tipo) {
        mostrarNotificacion(
          `La extensión del archivo ${file.name} no es válida.`,
          "error"
        );
        return false;
      }
      return true;
    });
    setArchivos((prevArchivos) => [...prevArchivos, ...nuevosArchivos]);
  }

  function handleInputChange(e) {
    handleArchivoChange(e.target.files);
  }
  function handleDragOver(e) {
    e.preventDefault();
    setDragActivo(true);
  }
  function handleDragLeave() {
    setDragActivo(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragActivo(false);
    handleArchivoChange(e.dataTransfer.files);
  }
  function handleClick() {
    inputRef.current?.click();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (archivos.length === 0) {
      mostrarNotificacion("Por favor, seleccione al menos un archivo.", "error");
      return;
    }
    let huboError = false;
    for (const archivo of archivos) {
      const extension = archivo.name.split(".").pop().toLowerCase();
      const tipo = tiposArchivo.find(
        (t) => t.extension.toLowerCase() === extension
      );
      if (tipo) {
        try {
          await uploadFile(archivo, idEvidencia, tipo.id_tipo_archivo);
        } catch (error) {
          huboError = true;
        }
      }
    }
    setArchivos([]);
    if (huboError) {
      mostrarNotificacion("Algunos archivos no se subieron correctamente.", "error");
    } else {
      mostrarNotificacion("Archivos subidos exitosamente.", "exito");
    }
    // Notifica al padre para recargar la tabla
    if (onArchivosSubidos) onArchivosSubidos();
    // Cierra el popup tras un breve delay
    setTimeout(onClose, 1200);
  }

  return (
    <div className="popup-preview-overlay" onClick={e => e.target.classList.contains("popup-preview-overlay") && onClose()}>
      <div className="popup-preview-content" style={{ minWidth: 500, maxWidth: 1000, position: "relative" }}>
        <button
          className="btn-cerrar-popup"
          onClick={onClose}
          aria-label="Cerrar"
        >×</button>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Subir Archivos</h3>
        {mensaje.texto && (
          <div className={`notificacion ${mensaje.tipo}`}>{mensaje.texto}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div
            className={`drop-area ${dragActivo ? "activo" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            style={{ marginBottom: 16 }}
          >
            <p>
              Arrastra y suelta archivos aquí o haz clic para seleccionarlos
            </p>
            <input
              type="file"
              ref={inputRef}
              onChange={handleInputChange}
              style={{ display: "none" }}
              multiple
            />
          </div>
          {archivos.length > 0 && (
            <div className="archivos-seleccionados">
              {archivos.map((archivo, index) => (
                <div
                  key={index}
                  className="archivo-seleccionado"
                  title="Quitar archivo"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setArchivos((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  <div className="archivo-info">
                    <img
                      src={obtenerIcono(archivo.name)}
                      alt="icono archivo"
                      className="icono-archivo-seleccionado"
                    />
                    <div>
                      <div className="archivo-nombre">{archivo.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="formulario-campos" style={{ marginTop: 12 }}>
            <button type="submit">Subir Archivos</button>
          </div>
        </form>
      </div>
    </div>
  );
}