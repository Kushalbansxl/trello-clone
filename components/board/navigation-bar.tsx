'use client'

import { useState } from 'react'
import { Search, Filter, Calendar, Tag, Users, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useBoardContext } from '@/lib/board-store'

export function NavigationBar() {
  const { state, dispatch } = useBoardContext()
  const [searchFocused, setSearchFocused] = useState(false)
  
  const activeFilterCount = 
    state.filterLabels.length + 
    state.filterMembers.length + 
    (state.filterDueDate !== 'all' ? 1 : 0)

  const clearAllFilters = () => {
    dispatch({ type: 'SET_FILTER_LABELS', payload: [] })
    dispatch({ type: 'SET_FILTER_MEMBERS', payload: [] })
    dispatch({ type: 'SET_FILTER_DUE_DATE', payload: 'all' })
  }

  return (
    <nav className="h-14 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-6 gap-4 relative z-50">
      
      {/* LOGO AREA - RESTORED ORIGINAL LOGO 🔥 */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-white font-semibold hidden sm:block">Kanban</span>
        </div>
      </div>

      {/* SEARCH & FILTER AREA - WIDE SEARCH BAR RESTORED */}
      <div className="flex-1 max-w-2xl flex items-center gap-2 md:gap-3 ml-4">
        
        {/* Wide, Rounded-xl Search Bar */}
        <div className={`relative flex-1 transition-all duration-200 ${searchFocused ? 'ring-1 ring-white/30 rounded-xl' : ''}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search cards..."
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="pl-9 h-9 bg-black/40 hover:bg-black/50 border border-white/10 text-white placeholder:text-white/40 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 transition-all shadow-sm text-sm"
          />
          {state.searchQuery && (
            <button
              onClick={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white bg-white/10 hover:bg-white/20 rounded-md p-0.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Normal Sized, Rounded-xl Filter Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`h-9 px-3.5 rounded-xl border transition-all duration-200 gap-2 shadow-sm ${
                activeFilterCount > 0 
                  ? 'bg-primary/20 border-primary/30 text-white' 
                  : 'bg-black/40 border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline font-medium tracking-wide text-sm">Filter</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground font-bold border-none">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          
          {/* Dark Glass Filter Menu */}
          <PopoverContent className="w-80 p-0 bg-black/80 backdrop-blur-3xl border-white/10 text-white rounded-2xl shadow-2xl z-50 overflow-hidden" align="end">
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <h3 className="font-bold tracking-tight">Filters</h3>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg">
                    Clear all
                  </Button>
                )}
              </div>
            </div>
            
            <div className="p-5 space-y-6">
              
              {/* LABELS */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 flex items-center gap-1.5 mb-3">
                  <Tag className="h-3.5 w-3.5" /> Labels
                </label>
                <div className="flex flex-wrap gap-2">
                  {state.labels.map((label) => {
                    const isSelected = state.filterLabels.includes(label.id)
                    return (
                      <button
                        key={label.id}
                        onClick={() => {
                          dispatch({
                            type: 'SET_FILTER_LABELS',
                            payload: isSelected
                              ? state.filterLabels.filter((id) => id !== label.id)
                              : [...state.filterLabels, label.id],
                          })
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? 'ring-2 ring-white/50 shadow-lg scale-105 border-transparent'
                            : 'opacity-60 hover:opacity-100 hover:scale-105 border-white/10'
                        }`}
                        style={{ backgroundColor: isSelected ? label.color : `${label.color}40`, color: 'white' }}
                      >
                        {label.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* MEMBERS */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 flex items-center gap-1.5 mb-3">
                  <Users className="h-3.5 w-3.5" /> Members
                </label>
                <div className="flex flex-wrap gap-2">
                  {state.members.map((member) => {
                    const isSelected = state.filterMembers.includes(member.id)
                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          dispatch({
                            type: 'SET_FILTER_MEMBERS',
                            payload: isSelected
                              ? state.filterMembers.filter((id) => id !== member.id)
                              : [...state.filterMembers, member.id],
                          })
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/20 text-white shadow-md'
                            : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Avatar className="h-5 w-5 border border-white/20">
                          <AvatarImage src={member.avatar || ""} />
                          <AvatarFallback className="text-[9px] font-bold bg-primary text-primary-foreground">
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium pr-1">{member.name.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DUE DATE */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 flex items-center gap-1.5 mb-3">
                  <Calendar className="h-3.5 w-3.5" /> Due Date
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between h-9 bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white rounded-xl font-medium">
                      {state.filterDueDate === 'all' && 'All cards'}
                      {state.filterDueDate === 'overdue' && 'Overdue'}
                      {state.filterDueDate === 'dueToday' && 'Due today'}
                      {state.filterDueDate === 'dueThisWeek' && 'Due this week'}
                      {state.filterDueDate === 'noDueDate' && 'No due date'}
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-black/90 backdrop-blur-3xl border-white/10 text-white rounded-xl shadow-2xl p-1">
                    {(['all', 'overdue', 'dueToday', 'dueThisWeek', 'noDueDate'] as const).map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option}
                        checked={state.filterDueDate === option}
                        onCheckedChange={() =>
                          dispatch({ type: 'SET_FILTER_DUE_DATE', payload: option })
                        }
                        className="rounded-lg hover:bg-white/10 focus:bg-white/10 cursor-pointer text-sm font-medium py-2"
                      >
                        {option === 'all' && 'All cards'}
                        {option === 'overdue' && <span className="text-red-400">Overdue</span>}
                        {option === 'dueToday' && <span className="text-amber-400">Due today</span>}
                        {option === 'dueThisWeek' && 'Due this week'}
                        {option === 'noDueDate' && 'No due date'}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* USER PROFILE */}
      <div className="flex items-center gap-2 shrink-0">
        <Avatar className="h-8 w-8 cursor-pointer border border-transparent ring-1 ring-white/20 hover:ring-white/40 transition-all shadow-sm">
          <AvatarImage src={state.currentUser.avatar ||""} />
          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
            {state.currentUser.name.split(' ').map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </div>
    </nav>
  )
}