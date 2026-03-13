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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
    <nav className="h-14 bg-black/30 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-white font-semibold hidden sm:block">Kanban</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl flex items-center gap-2">
        <div className={`relative flex-1 transition-all duration-200 ${searchFocused ? 'ring-2 ring-white/30 rounded-md' : ''}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search cards..."
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {state.searchQuery && (
            <button
              onClick={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white gap-2"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear all
                  </Button>
                )}
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4" />
                  Labels
                </label>
                <div className="flex flex-wrap gap-2">
                  {state.labels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => {
                        const isSelected = state.filterLabels.includes(label.id)
                        dispatch({
                          type: 'SET_FILTER_LABELS',
                          payload: isSelected
                            ? state.filterLabels.filter((id) => id !== label.id)
                            : [...state.filterLabels, label.id],
                        })
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        state.filterLabels.includes(label.id)
                          ? 'ring-2 ring-offset-2 ring-gray-400'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: label.color, color: 'white' }}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Members
                </label>
                <div className="flex flex-wrap gap-2">
                  {state.members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        const isSelected = state.filterMembers.includes(member.id)
                        dispatch({
                          type: 'SET_FILTER_MEMBERS',
                          payload: isSelected
                            ? state.filterMembers.filter((id) => id !== member.id)
                            : [...state.filterMembers, member.id],
                        })
                      }}
                      className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all ${
                        state.filterMembers.includes(member.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-[10px]">
                          {member.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{member.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between">
                      {state.filterDueDate === 'all' && 'All cards'}
                      {state.filterDueDate === 'overdue' && 'Overdue'}
                      {state.filterDueDate === 'dueToday' && 'Due today'}
                      {state.filterDueDate === 'dueThisWeek' && 'Due this week'}
                      {state.filterDueDate === 'noDueDate' && 'No due date'}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {(['all', 'overdue', 'dueToday', 'dueThisWeek', 'noDueDate'] as const).map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option}
                        checked={state.filterDueDate === option}
                        onCheckedChange={() =>
                          dispatch({ type: 'SET_FILTER_DUE_DATE', payload: option })
                        }
                      >
                        {option === 'all' && 'All cards'}
                        {option === 'overdue' && 'Overdue'}
                        {option === 'dueToday' && 'Due today'}
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

      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-white/20">
          <AvatarImage src={state.currentUser.avatar} />
          <AvatarFallback className="bg-blue-500 text-white text-xs">
            {state.currentUser.name.split(' ').map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </div>
    </nav>
  )
}
