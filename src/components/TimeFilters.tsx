import { useEffect, useRef } from 'react'
import ModernDropdown from './ModernDropdown'
import DateRangePicker from './DateRangePicker'
import { toast } from 'sonner'
import { useUsers } from '../hooks/useUsers'

interface Option {
    id: string
    name: string
}

interface User {
    id: string
    full_name: string
    team_ids?: string[]
}

interface Props {

    teams: Option[]
    clients: Option[]
    users: User[]

    selectedTeamId: string
    selectedClientId: string
    selectedUserId: string

    setSelectedTeamId: (v: string) => void
    setSelectedClientId: (v: string) => void
    setSelectedUserId: (v: string) => void

    startDate: Date
    endDate: Date
    setStartDate: (d: Date) => void
    setEndDate: (d: Date) => void

    canAdvancedReports?: boolean

    showExportMenu?: boolean
    setShowExportMenu?: (v: boolean) => void

    handleExportPDF?: () => void
    handleExportCSV?: () => void

    onInsightsClick?: () => void
}

export default function TimeFilters({

    teams,
    clients,
    users,

    selectedTeamId,
    selectedClientId,
    selectedUserId,

    setSelectedTeamId,
    setSelectedClientId,
    setSelectedUserId,

    startDate,
    endDate,
    setStartDate,
    setEndDate,

    canAdvancedReports = false,

    showExportMenu = false,
    setShowExportMenu,

    handleExportPDF,
    handleExportCSV,

    onInsightsClick

}: Props) {

    const menuRef = useRef<HTMLDivElement | null>(null)

    // const allUsers = useUsers() as User[]
    const usersFromHook = useUsers() as User[]
    const allUsers = users && users.length ? users : usersFromHook

    // const [clients, setClients] = useState<Option[]>([])

    // useEffect(() => {

    //     const fetchClients = async () => {

    //         const { data } = await supabase
    //             .from('clients')
    //             .select('id,name, team')
    //             .order('name')

    //         if (data) setClients(data)

    //     }

    //     fetchClients()

    // }, [])

    const teamOptions = [
        { id: '', name: 'Todas as Equipes' },
        ...teams
    ]

    const clientOptions = [
        { id: '', name: 'Todos os Clientes' },
        ...clients
    ]

    // const clientOptions = [
    //     { id: '', name: 'Todos os Clientes' },
    //     ...clients
    // ]

    const filteredUsers = selectedTeamId
        ? allUsers.filter(u => u.team_ids?.includes(selectedTeamId))
        : allUsers

    const userOptions = [
        { id: '', name: 'Todos os usuários' },
        ...filteredUsers.map(u => ({
            id: u.id,
            name: u.full_name || 'Usuário'
        }))
    ]

    useEffect(() => {

        const handleClickOutside = (event: MouseEvent) => {

            if (!menuRef.current) return

            if (!menuRef.current.contains(event.target as Node)) {
                setShowExportMenu?.(false)
            }

        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }

    }, [setShowExportMenu])

    return (

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-surface-dark border border-gray-800 p-4 rounded-xl shadow-lg z-20">

            {/* FILTERS */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full lg:w-auto">

                <ModernDropdown
                    options={teamOptions}
                    value={selectedTeamId}
                    onChange={setSelectedTeamId}
                    placeholder="Equipe"
                    icon="group"
                />

                <ModernDropdown
                    options={clientOptions}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    placeholder="Cliente"
                    icon="domain"
                />

                <ModernDropdown
                    options={userOptions}
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                    placeholder="Selecionar usuário"
                    icon="person"
                />

                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(s, e) => {
                        setStartDate(s)
                        setEndDate(e)
                    }}
                />

            </div>

            {/* ACTIONS */}

            {(setShowExportMenu || onInsightsClick) && (

                <div className="w-full lg:w-auto flex justify-end gap-2">

                    {/* EXPORT */}

                    {setShowExportMenu && (

                        <div className="relative" ref={menuRef}>

                            <button
                                onClick={() => {

                                    if (!canAdvancedReports) {

                                        toast.error('Recurso exclusivo PRO: Exportação de Relatórios.')
                                        return
                                    }

                                    setShowExportMenu?.(!showExportMenu)

                                }}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium whitespace-nowrap ${canAdvancedReports
                                        ? 'border-gray-700 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5'
                                        : 'border-gray-800 text-gray-600 cursor-not-allowed'
                                    }`}
                            >

                                <span className="material-symbols-outlined">
                                    {canAdvancedReports ? 'download' : 'lock'}
                                </span>

                                Exportar

                            </button>

                            {showExportMenu && (

                                <div className="absolute top-full right-0 mt-2 w-48 bg-surface-dark border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in flex flex-col">

                                    <button
                                        onClick={() => {
                                            handleExportPDF?.()
                                            setShowExportMenu?.(false)
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-sm text-gray-300 hover:text-white transition-colors border-b border-gray-800"
                                    >

                                        <span className="material-symbols-outlined text-red-400">
                                            picture_as_pdf
                                        </span>

                                        Exportar PDF

                                    </button>

                                    <button
                                        onClick={() => {
                                            handleExportCSV?.()
                                            setShowExportMenu?.(false)
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-sm text-gray-300 hover:text-white transition-colors"
                                    >

                                        <span className="material-symbols-outlined text-green-400">
                                            csv
                                        </span>

                                        Exportar Excel/CSV

                                    </button>

                                </div>

                            )}

                        </div>

                    )}

                    {/* INSIGHTS */}

                    {onInsightsClick && (

                        <button
                            onClick={() => {

                                if (!canAdvancedReports) {

                                    toast.error('Recurso exclusivo PRO: Insights e Tendências.')
                                    return
                                }

                                onInsightsClick()

                            }}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium whitespace-nowrap ${canAdvancedReports
                                    ? 'border-gray-700 text-gray-400 hover:text-white hover:border-primary/50 hover:bg-white/5'
                                    : 'border-gray-800 text-gray-600 cursor-not-allowed'
                                }`}
                        >

                            <span className="material-symbols-outlined">
                                {canAdvancedReports ? 'insights' : 'lock'}
                            </span>

                            Ver Insights

                        </button>

                    )}

                </div>

            )}

        </div>

    )

}